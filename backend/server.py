from fastapi import FastAPI, WebSocket, WebSocketDisconnect, APIRouter, Response, BackgroundTasks
from pydantic import BaseModel
from fastapi import Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.encoders import jsonable_encoder
import uvicorn
import pandas as pd
from loguru import logger
from cif_to_pdb import cif_to_pdb
import numpy as np
import json
import asyncio
import traceback
import os
import time
import concurrent.futures
from functools import lru_cache
import re
import tqdm
import csv
import io
import uuid
from typing import Dict, Any
from pathlib import Path

# Read DATA_PATH from environment variable
DATA_PATH = os.environ.get("DATA_PATH")
if not DATA_PATH:
    raise RuntimeError("DATA_PATH environment variable is not set")

# Read DATA_WEBSERVER_PATH from environment variable
DATA_WEBSERVER_PATH = os.environ.get("DATA_WEBSERVER_PATH")
if not DATA_WEBSERVER_PATH:
    raise RuntimeError("DATA_WEBSERVER_PATH environment variable is not set")

start_time = time.time()
DATA_FULL = pd.read_parquet(
    f"{DATA_WEBSERVER_PATH}/data.parquet"
).drop(columns=["afdb_hq"])
DATA_FULL["protein"] = list(DATA_FULL.index)
DATA_FULL = DATA_FULL.rename(columns={"origin": "taxonomy_name", "database": "origin"})

logger.info(f"Taxonomy: {DATA_FULL['taxonomy'].value_counts()}")

logger.info(f"Loading main data took {time.time() - start_time:.2f}s ({len(DATA_FULL)} points)")

logger.info(f"Columns: {DATA_FULL.columns}")
logger.info(f"Data: {DATA_FULL.iloc[0]}")

DATA_FULL = DATA_FULL.sample(frac=1, random_state=42)
DATA_FULL.loc[
    (DATA_FULL["origin"] != "AFDB light clusters") & (DATA_FULL["origin"] != "AFDB dark clusters"),
    "afdb_pLDDT",
] = -1
DATA_FULL["clean_name"] = DATA_FULL["protein"].str.replace("AF-", "").str.replace("-model_v4", "").str.replace("-F1", "")
DATA_FULL["representative"] = DATA_FULL["clean_name"]
DATA_FULL.set_index("protein")
DATA = DATA_FULL[DATA_FULL['cluster_or_singleton'] == DATA_FULL.index]

PDB_LOC = f"{DATA_PATH}/mip-follow-up_clusters/struct/"
GOTERM_LOC = f"{DATA_WEBSERVER_PATH}/deepfri_predictions_HQ"
PROTEIN_GOTERM_LOC = f"{DATA_WEBSERVER_PATH}/deepfri_predictions_protein_HQ"

start_time = time.time()
GOTERMS_NAME = pd.read_csv(
    f"{DATA_WEBSERVER_PATH}/gonames.csv", index_col=0
).rename(columns={"index": "GOterm"})
logger.info(f"Loading GO terms names took {time.time() - start_time:.2f}s")

TOP_10_GEOTERM_NAMES = [
    { "GOname": "cell periphery", "GOterm": "GO:0071944", "Ontology": "CC" },
    { "GOname": "cellular component organization", "GOterm": "GO:0016043", "Ontology": "BP" },
    { "GOname": "cellular response to stimulus", "GOterm": "GO:0051716", "Ontology": "BP" },
    { "GOname": "integral component of membrane", "GOterm": "GO:0016021", "Ontology": "CC" },
    { "GOname": "intrinsic component of membrane", "GOterm": "GO:0031224", "Ontology": "CC" },
    { "GOname": "nucleus", "GOterm": "GO:0005634", "Ontology": "CC" },
    { "GOname": "plasma membrane", "GOterm": "GO:0005886", "Ontology": "CC" },
    { "GOname": "RNA metabolic process", "GOterm": "GO:0016070", "Ontology": "BP" }
]

MAPPED_COLUMN_NAMES = {
    "protein_id": "protein",
    "database": "origin",
    "repr_protein_id": "cluster_or_singleton",
    "x": "x",
    "y": "y",
    "length": "length",
    "afdb_pLDDT": "afdb_pLDDT",
    "superCOG_v10": "superCOG_v10",
    "superCOG_v11": "superCOG_v11",
    "taxonomy": "taxonomy",
    "origin": "taxonomy_name",
    "url": "url"
}

start_time = time.time()
REPRESENTATIVE_MAPPING = pd.read_parquet(
    f"{DATA_WEBSERVER_PATH}/all_clusters_nf.parquet"
)
logger.info(f"Loading representative mapping took {time.time() - start_time:.2f}s")
REPRESENTATIVE_MAPPING["Protein"] = REPRESENTATIVE_MAPPING["Protein"].map(lambda x: json.loads(x))

start_time = time.time()
REVERSE_REPRESENTATIVE_MAPPING = REPRESENTATIVE_MAPPING.explode("Protein")
REVERSE_REPRESENTATIVE_MAPPING = pd.DataFrame.from_dict([
    {"Protein": protein, "Cluster": cluster}
    for protein, cluster in zip(REVERSE_REPRESENTATIVE_MAPPING["Protein"], REVERSE_REPRESENTATIVE_MAPPING.index)
]).set_index("Protein")
logger.info(f"Creating reverse mapping took {time.time() - start_time:.2f}s")

# Replace the slow initialization with a vectorized approach
start_time = time.time()
# Create dictionary mapping lowercase protein names to original indices
PROTEIN_INDEX_MAP = {name.lower(): name for name in REVERSE_REPRESENTATIVE_MAPPING.index}

# Create a precomputed lowercase version once
DATA['clean_name_lower'] = DATA['clean_name'].str.lower()

# Create mapping using a single vectorized operation
# Get all unique clusters in lowercase
unique_clusters = set(cluster.lower() for cluster in REPRESENTATIVE_MAPPING.index)

# Create lookup dict using vectorized operations
CLUSTER_TO_DATA = {}
# Get all matching rows in one operation
matching_mask = DATA['clean_name_lower'].isin(unique_clusters)
matching_data = DATA[matching_mask]
# Create the mapping dict directly
from tqdm import tqdm
CLUSTER_TO_DATA = {row['clean_name_lower']: row for _, row in tqdm(matching_data.iterrows(), desc="Building cluster to data mapping", total=len(matching_data))}

logger.info(f"Building search indices took {time.time() - start_time:.2f}s")

@lru_cache(maxsize=1000)
def search_proteins(search_term):
    """Cache protein name searches for better performance"""
    search_term_lower = search_term.lower()
    pattern = re.compile(search_term_lower)
    # Fast regex-based search through keys
    matching_keys = [key for key in PROTEIN_INDEX_MAP.keys() 
                     if pattern.search(key)]
    return matching_keys[:100]  # Limit to 100 matching proteins

GOTERMS_CACHE = {}

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "Content-Disposition"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

api_router = APIRouter(prefix="/api")

def get_initial_points(goTerm = None, ontology = None):
    start_time = time.time()
    if goTerm and ontology:
        subset_orig = get_points(goterm = goTerm, ontology = ontology, number_of_points = 10000)
    else:
        subset_orig = DATA.sample(10000, random_state=42).to_dict(orient="records")
    logger.info(f"Initial points sampling took {time.time() - start_time:.2f}s")
    return subset_orig


def get_points(
    x0: float = -15,
    x1: float = 15,
    y0: float = -25,
    y1: float = 15,
    types: str = "",
    lengthRange: str = "",
    pLDDT: str = "",
    supercog: str = "",
    goterm: str = "",
    ontology: str="",
    taxonomy: str="",
    number_of_points: int = 1000,
    ids = "",
    columns = [],
    onlyRepresentatives=True
):
    total_start_time = time.time()
    conditions = []

    if ids:
        ids = ids.split(",")
        conditions.append(DATA_FULL["clean_name"].isin(ids))

    if len(types) > 0:
        types = types.split(",")
        conditions.append(DATA_FULL["origin"].isin(types))
    
    if lengthRange:
        lengthRange = lengthRange.split(",")
        lengthRange = [int(lengthRange[0]), int(lengthRange[1])]
        conditions.append(
            (DATA_FULL.length >= lengthRange[0]) & (DATA_FULL.length <= lengthRange[1])
        )

    if pLDDT:
        pLDDT = pLDDT.split(",")
        pLDDT = [int(pLDDT[0]), int(pLDDT[1])]
        minus_one = DATA_FULL["afdb_pLDDT"] == -1
        larger = DATA_FULL["afdb_pLDDT"] <= pLDDT[1]
        smaller = DATA_FULL["afdb_pLDDT"] >= pLDDT[0]

        conditions.append((minus_one | (larger & smaller)))

    if supercog:
        supercog = supercog.split(",")
        conditions.append(DATA_FULL["superCOG_v10"].isin(supercog))
        
    if taxonomy:
        taxonomy_split = taxonomy.split(",")
        conditions.append(DATA_FULL["taxonomy"].isin(taxonomy_split))
        
    logger.info(f"Goterm: {goterm}, ontology: {ontology}, taxonomy: {taxonomy}")
    if goterm:
        start_time = time.time()
        
        if not ontology:
            ontology = "BP"
        
        goterm_loc = f"{GOTERM_LOC}/{ontology}/{goterm}.csv"
        if not os.path.exists(goterm_loc):
            logger.info(f"File check took {time.time() - start_time:.2f}s")
            return []
        
        cache_time = time.time()
        if goterm not in GOTERMS_CACHE:
            goterm_df = pd.read_csv(goterm_loc)
            GOTERMS_CACHE[goterm] = set(goterm_df["Protein"].tolist())
            logger.info(f"Loading GO term data took {time.time() - cache_time:.2f}s")
            
        intersect_time = time.time()
        names = set(DATA_FULL["protein"])
        names = names.intersection(GOTERMS_CACHE[goterm])
        conditions.append(DATA_FULL["protein"].isin(names))
        logger.info(f"Intersection took {time.time() - intersect_time:.2f}s")
        logger.info(f"Total GO term processing took {time.time() - start_time:.2f}s")
        
    filter_start_time = time.time()
    mask = ((DATA_FULL.x >= x0) & (DATA_FULL.x <= x1) & (DATA_FULL.y >= y0) & (DATA_FULL.y <= y1))

    if onlyRepresentatives:
        conditions.append(DATA_FULL['cluster_or_singleton'] == DATA_FULL['protein'])

    # Add all other conditions to the mask at once
    if conditions:
        for cond in conditions:
            mask &= cond
        
    subset = DATA_FULL[mask]

    logger.info(f"Initial spatial filtering took {time.time() - filter_start_time:.2f}s")
    
    if len(subset) > number_of_points:
        subset = subset[:number_of_points]

    if len(columns) > 0:
        subset = subset[list(map(lambda column: MAPPED_COLUMN_NAMES[column], columns))]
    
    if 'length' in subset.columns:
        subset['length'] = subset['length'].astype('Int64')
        
    logger.info(f"Total get_points processing took {time.time() - total_start_time:.2f}s with {len(subset)} results")
    return subset.to_dict(orient="records")


@api_router.get("/points_init")
async def points():
    return get_initial_points()


@api_router.get("/points")
async def points(
    x0: float = -15,
    x1: float = 15,
    y0: float = -25,
    y1: float = 15,
    types: str = "",
    lengthRange: str = "",
    pLDDT: str = "",    
    supercog: str = "",
    goterm: str = "",
    ontology: str = "",
    taxonomy: str = ""
):
    return get_points(x0, x1, y0, y1, types, lengthRange, pLDDT, supercog, goterm, ontology, taxonomy)

@api_router.get("/pdb_loc/{protein:str}")
async def pdb_loc(protein: str):
    # return DATA_FULL.loc[protein, "pdb_loc"]
    row = DATA_FULL[DATA_FULL.index == protein]
    if len(row) == 0:
        return None
    return row["pdb_loc"].values[0]

@api_router.get("/pdb/{pdb_id:path}", response_class=FileResponse)
async def pdb(pdb_id: str):
    pdb_id = pdb_id.replace("..", "")
    full_loc = PDB_LOC + pdb_id
    if full_loc.endswith(".pdb"):
        return full_loc

    elif full_loc.endswith(".cif"):
        start_time = time.time()
        cif_to_pdb(full_loc, full_loc + ".pdb")
        logger.info(f"CIF to PDB conversion took {time.time() - start_time:.2f}s")
        return full_loc + ".pdb"

class GotermBody(BaseModel):
    points: list[str]
    goterm: str
    ontology: str

@api_router.post("/goterm")
async def goterms(body: GotermBody):
    points = body.points
    goterm = body.goterm
    ontology = body.ontology

    goterm_loc = f"{GOTERM_LOC}/{ontology}/{goterm}.csv"
    if not os.path.exists(goterm_loc):
        return [False for _ in range(10000)]
    
    if goterm not in GOTERMS_CACHE:
        goterm_df = pd.read_csv(goterm_loc)
        GOTERMS_CACHE[goterm] = set(goterm_df["Protein"].tolist())

    result = []

    for point_id in points:  
        if point_id in GOTERMS_CACHE[goterm]:
            result.append(True)
        else:
            result.append(False)
    return result

@api_router.get("/goterm/{protein:str}")
async def protein_goterm(protein: str):
    # Check for the protein in both DeepFRI 1.0 (main dataset) and 1.1 (new folds)
    protein_file = f"{PROTEIN_GOTERM_LOC}/{protein}.csv"
    
    if not os.path.exists(protein_file):
        logger.info(f"No GO term predictions found for protein: {protein}")
        return []
    
    try:
        # Read the GO term predictions for this protein
        start_time = time.time()
        goterms_df = pd.read_csv(protein_file)
        logger.info(f"Loading protein GO terms for {protein} took {time.time() - start_time:.2f}s")
        
        # Format the results to include GO term ID, ontology, name, and score
        format_start_time = time.time()
        results = []
        for _, row in goterms_df.iterrows():
            go_id = row.get("GO-term", "")
            ontology = row.get("Ontology", "")
            score = row.get("Score", 0)
            
            # Look up the GO term name if available
            go_name = ""
            if go_id in GOTERMS_NAME["GOterm"].values:
                go_name = GOTERMS_NAME.loc[GOTERMS_NAME["GOterm"] == go_id, "GOname"].values[0]
            
            results.append({
                "go_id": go_id,
                "ontology": ontology,
                "name": go_name,
                "score": score
            })
        
        # Sort by score (descending)
        results.sort(key=lambda x: x["score"], reverse=True)
        logger.info(f"Formatting GO terms data took {time.time() - format_start_time:.2f}s")
        return results
    
    except Exception as e:
        logger.error(f"Error reading GO terms for {protein}: {str(e)}")
        return {"error": f"Error processing GO terms: {str(e)}"}


@api_router.get("/name_search")
async def name_search(
    name: str,
    x0: float = -15,
    x1: float = 15,
    y0: float = -25,
    y1: float = 15,
    types: str = "",
    lengthRange: str = "",
    pLDDT: str = "",    
    supercog: str = "",
    taxonomy: str = ""
):
    start_time = time.time()
    
    # Use cached regex search for faster matching
    matching_keys = search_proteins(name)
    
    if not matching_keys:
        return []
    
    # Get original indices
    original_indices = [PROTEIN_INDEX_MAP[key] for key in matching_keys[:10]]
    
    # Fast lookup using iloc
    all_matching = REVERSE_REPRESENTATIVE_MAPPING.loc[original_indices]
    logger.info(f"Finding matching names took {time.time() - start_time:.2f}s")
    
    processing_start_time = time.time()

    if pLDDT:
        pLDDT = pLDDT.split(",")
        pLDDT = [int(pLDDT[0]), int(pLDDT[1])]
    
    if supercog:
        supercog = supercog.split(",")
        
    if taxonomy:
        taxonomy_split = taxonomy.split(",")
    
    if len(types) > 0:
        types = types.split(",")
    
    if lengthRange:
        lengthRange = lengthRange.split(",")
        lengthRange = [int(lengthRange[0]), int(lengthRange[1])]
    
    # Use precomputed data instead of filtering DATA again
    subset = []
    for found_name, cluster in zip(all_matching.index, all_matching["Cluster"]):
        cluster_lower = cluster.lower()
        if cluster_lower in CLUSTER_TO_DATA:
            data_ = CLUSTER_TO_DATA[cluster_lower].to_dict()
            data_["chosen_protein"] = DATA_FULL.loc[name].fillna("").to_dict()
            data_["representative"] = cluster
            data_["protein"] = found_name
            other_proteins_data = DATA_FULL[DATA_FULL["cluster_or_singleton"] == cluster]
            other_values = []
            for index, row in other_proteins_data.iterrows():
                if not types or (row.x >= x0 and row.x <= x1 and row.y >= y0 and row.y < y1 and row.length >= lengthRange[0] and row.length <= lengthRange[1] \
                and row["afdb_pLDDT"] >= pLDDT[0] and row["afdb_pLDDT"] <= pLDDT[1] and row["taxonomy"] in taxonomy and row["superCOG_v10"] in supercog \
                and row["origin"] in types):
                    other_values.append({"name": row["clean_name"], "url": row["url"]})
            for i, row in enumerate(other_values):
                if row["name"] == cluster:
                    other_values.insert(0, other_values.pop(i))
                    break
            data_["others"] = other_values
            subset.append(data_)
    logger.info(f"Processing matching names took {time.time() - processing_start_time:.2f}s")
    return jsonable_encoder(subset)


@api_router.get("/goterm_autocomplete")
async def goterm_autocomplete(goterm: str):
    if goterm == "" or goterm is None:
        return TOP_10_GEOTERM_NAMES
    start_time = time.time()
    subset = GOTERMS_NAME[
        GOTERMS_NAME["GOname"].str.lower().str.contains(goterm.lower())
    ][:10]
    logger.info(f"GO term autocomplete for '{goterm}' took {time.time() - start_time:.2f}s")
    return subset.to_dict(orient="records")

EXPORT_DIR = Path("exports")
EXPORT_DIR.mkdir(exist_ok=True)

jobs: Dict[str, Dict[str, Any]] = {}

def generate_tsv(job_id: str, body: dict):
    pLDDT = body.get("pLDDT", [])
    lengthRange = body.get("lengthRange", [])
    taxonomy = body.get("taxonomy", [])
    supercog = body.get("supercog", [])
    selectedSources = body.get("selectedSources", [])
    columnNames = body.get("columnNames")
    x0 = body.get("x0")
    x1 = body.get("x1")
    y0 = body.get("y0")
    y1 = body.get("y1")
    ontology = body.get("ontology")
    goTerm = body.get("goTerm")
    ids = body.get("ids", [])
    onlyRepresentatives = body.get("onlyRepresentatives", False)

    points = get_points(
        x0=float(x0),
        x1=float(x1),
        y0=float(y0),
        y1=float(y1),
        types=",".join(map(str, selectedSources)),
        lengthRange=",".join(map(str, lengthRange)),
        pLDDT=",".join(map(str, pLDDT)),
        supercog=",".join(map(str, supercog)),
        goterm=goTerm,
        ontology=ontology,
        taxonomy=",".join(map(str, taxonomy)),
        number_of_points=10000000,
        ids=",".join(ids),
        columns=columnNames,
        onlyRepresentatives=onlyRepresentatives
    )

    file_path = EXPORT_DIR / f"{job_id}.tsv"
    with file_path.open("w", newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        if points and len(points) > 0:
            header = [MAPPED_COLUMN_NAMES[col] for col in columnNames]
            writer.writerow(header)
            for point in points:
                cleaned_row = []
                for key, value in point.items():
                    if key in ("x", "y"):
                        cleaned_row.append(value)
                    elif isinstance(value, (int, float)) and value in (-1, -1.0):
                        cleaned_row.append("NaN")
                    else:
                        cleaned_row.append(value)
                writer.writerow(cleaned_row)

    jobs[job_id]["status"] = "ready"
    jobs[job_id]["file_path"] = str(file_path)

@api_router.post("/export_to_tsv/start")
async def start_export(request: Request, background_tasks: BackgroundTasks):
    body = await request.json()  # body["filters"] will have your filters object
    filters = body.get("filters")
    if not filters:
        return JSONResponse(status_code=400, content={"error": "Missing filters"})
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "processing"}
    background_tasks.add_task(generate_tsv, job_id, filters)
    return {"job_id": job_id, "status": "processing"}


@api_router.get("/export_to_tsv/status/{job_id}")
async def export_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    return job


@api_router.get("/export_to_tsv/download/{job_id}")
async def export_download(job_id: str, background_tasks: BackgroundTasks):   
    job = jobs.get(job_id)
    if not job or job.get("status") != "ready":
        return JSONResponse(status_code=404, content={"error": "File not ready"})
    
    file_path = job["file_path"]
    file_size = os.path.getsize(file_path)
    response = FileResponse(
        file_path,
        filename="data.tsv",
        media_type="text/tab-separated-values",
        headers={"Content-Length": str(file_size)}
    )

    # Schedule file deletion after sending response
    def delete_file(path):
        try:
            os.remove(path)
            print(f"Deleted {path}")
        except Exception as e:
            print(f"Failed to delete {path}: {e}")

    background_tasks.add_task(delete_file, file_path)

    return response


@api_router.websocket("/ws/points")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection established")

    try:
        while True:
            data = await websocket.receive_text()
            request_time = time.time()
            data = json.loads(data)

            if data.get("type") == "init":
                # Handle initial data load - these points stay permanently
                points = get_initial_points(goTerm = None, ontology = None)
                await websocket.send_json(
                    {
                        "type": "init",
                        "points": points,
                    }
                )
                logger.info(f"WebSocket init request processed in {time.time() - request_time:.2f}s")
            else:
                # Handle regular point queries - these points get updated
                try:
                    points = get_points(
                        x0=float(data.get("x0", -15)),
                        x1=float(data.get("x1", 15)),
                        y0=float(data.get("y0", -25)),
                        y1=float(data.get("y1", 15)),
                        types=",".join(data.get("types", [])),
                        lengthRange=",".join(map(str, data.get("lengthRange", []))),
                        pLDDT=",".join(map(str, data.get("pLDDT", []))),
                        supercog=",".join(map(str, data.get("supercog", []))),
                        goterm=data.get("goTerm", ""),
                        ontology=data.get("ontology", ""),
                        taxonomy=",".join(map(str, data.get("taxonomy", [])))
                    )
                    
                    if len(points) == 0:
                        await websocket.send_json({"type": "update", "points": [], "is_last": True})
                        logger.info(f"WebSocket query processed with no results in {time.time() - request_time:.2f}s")
                        continue

                    # Send points in batches of 100
                    send_start_time = time.time()
                    for i in range(0, len(points), 100):
                        batch = points[i : i + 100]
                        await websocket.send_json(
                            {
                                "type": "update",
                                "points": batch,
                                "is_last": i + 100 >= len(points),
                            }
                        )
                        await asyncio.sleep(0.01)  # Small delay between batches
                    
                    logger.info(f"WebSocket query processed and sent {len(points)} points in {time.time() - request_time:.2f}s (sending took {time.time() - send_start_time:.2f}s)")

                except Exception as e:
                    logger.error(f"WebSocket query error: {e}")
                    await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        logger.error(traceback.format_exc())

app.include_router(api_router)

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ws_max_size=1024 * 1024 * 10,  # 10MB max message size
        ws_ping_interval=None,  # Disable ping/pong
        ws_ping_timeout=None,
    )
