# Protein Structure Landscape Visualization

This project provides an interactive visualization tool for exploring large protein databases, revealing structural complementarity and functional locality across different protein sources.

The webserver is available at [https://protein-structure-landscape.sano.science/](https://protein-structure-landscape.sano.science/)

## Overview

The Protein Structure Landscape Visualization tool allows researchers and bioinformaticians to explore and analyze protein structures from various databases, including:

- AlphaFold Protein Structure Database (AFDB)
- ESMAtlas
- Microbiome Immunity Project (MIP)

The tool presents a unified, low-dimensional representation of the protein space, enabling users to investigate the relationships between protein structure, function, and origin.

## Features

- Interactive 2D scatter plot visualization of protein structures
- Filtering options for protein length, pLDDT scores, and superCOG annotations
- Search functionality to find specific proteins by name
- Finding proteins by their origin and function
- Detailed information display for selected proteins
- 3D protein structure viewer for individual proteins
- Publication details and contact information

## Technology Stack

- Frontend: React.js with Material-UI for the user interface
- Charting: CosmoGL for high-performance 2D plotting
- 3D Visualization: PDBe Molstar for protein structure rendering
- Backend: FastAPI

## Running in development mode

### Prerequisities
   - Having webserver data fetched locally (including `data.parquet`, counts csv files etc.). There should be an Environment Variable `DATA_WEBSERVER_PATH` set pointing into this directory.
   - (Optional) Having fetched mip follow up clusters and having an Environment Variable `DATA_PATH` set pointing to this directory. WARNING: although this is optional, the env var must be set (even into an empty directory).

1. Clone the repository
2. (Once) Install frontend dependencies:
   ```
   cd frontend
   yarn install
   cd ..
   ```
3. (Once) Install backend dependencies:
   ```
   cd backend
   pip3 install -r requirements.txt
   cd ..
   ```
4. (Once) Set the environment variables for backend:
   ```
   export DATA_WEBSERVER_PATH="{path to data for webserver}"
   export DATA_PATH="{path to mip follow up clusters}"
   ```
5. Run backend
   ```
   python backend/server.py
   ```
6. (in a separate terminal) Set up the environment variable for frontend:
   ```
   export VITE_DJANGO_HOST="http://localhost:8000"
   ```
7. Run frontend:
   ```
   cd frontend
   npm run dev
   ```

## Running in production

### Prerequisities
   - Having webserver data fetched locally (including `data.parquet`, counts csv files etc.). There should be an Environment Variable `DATA_WEBSERVER_PATH` set pointing into this directory.
   - Having fetched mip follow up clusters and having an Environment Variable `DATA_PATH` set pointing to this directory.
   - having docker and docker compose installed.

### No SSL Mode

In this mode, the application runs on port 8080.

1. Clone the repository
2. (Once) Install frontend dependencies:
   ```
   cd frontend
   yarn install
   ```
3. Build frontend artifacts
   ```
   npm run build
   cd ..
   ```
4. (Once) Set the environment variables for backend:
   ```
   export DATA_WEBSERVER_PATH="{path to data for webserver}"
   export DATA_PATH="{path to mip follow up clusters}"
   ```
5. (Once) Set the environment variables for nginx:
   ```
   export EXTERNAL_PORT={external port to your VM, defaults to 8081}
   export USE_SSL="0"
   ```
6. If the application is running in docker, put it down
   ```
   sudo docker compose down
   ```
7. Run the application
   ```
   sudo --preserve-env=DATA_PATH,DATA_WEBSERVER_PATH,EXTERNAL_PORT,USE_SSL docker compose up --build -d
   ```

### SSL Mode

1. Clone the repository
2. (Once) Install frontend dependencies:
   ```
   cd frontend
   yarn install
   ```
3. Build frontend artifacts
   ```
   npm run build
   cd ..
   ```
4. (Once) Set the environment variables for backend:
   ```
   export DATA_WEBSERVER_PATH="{path to data for webserver}"
   export DATA_PATH="{path to mip follow up clusters}"
   ```
5. (Once) Set the environment variables for nginx:
   ```
   export EXTERNAL_PORT={external port to your VM, defaults to 8081}
   export USE_SSL="1"
   ```
6. Generate a certificate if it's not present:
   ```
   sudo snap install --classic certbot
   sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
   sudo certbot certonly --webroot -w ${pwd}/certbot/www -d ${echo $DOMAIN} --email ${echo $EMAIL} --agree-tos --no-eff-email
   ```
   Where EMAIL env is your email and DOMAIN is your domain (currently it's `protein-structure-landscape.sano.science`)
7. If the application is running in docker, put it down
   ```
   sudo docker compose down
   ```
8. Run the application
   ```
   sudo --preserve-env=DATA_PATH,DATA_WEBSERVER_PATH,EXTERNAL_PORT,USE_SSL docker compose up --build -d
   ```

## Usage

- Use the scatter plot to explore the protein landscape
- Apply filters to focus on specific subsets of proteins
- Click on data points to view detailed information and 3D structures
- Use the search bar to find proteins by name


## Citing

Szczerbiak P, Szydlowski L, Wydmański W, Renfrew PD, Koehler Leman J, Kosciolek T. Large protein databases reveal structural complementarity and functional locality. bioRxiv.

DOI: [https://doi.org/10.1101/2024.08.14.607935](https://doi.org/10.1101/2024.08.14.607935)

```
@article{szczerbiak_large_2024,
	title = {Large protein databases reveal structural complementarity and functional locality},
	url = {https://www.biorxiv.org/content/early/2024/08/17/2024.08.14.607935},
	doi = {10.1101/2024.08.14.607935},
	abstract = {Recent breakthroughs in protein structure prediction have led to an unprecedented surge in high-quality 3D models, highlighting the need for efficient computational solutions to manage and analyze this wealth of structural data. In our work, we comprehensively examine the structural clusters obtained from the AlphaFold Protein Structure Database (AFDB), a high-quality subset of ESMAtlas, and the Microbiome Immunity Project (MIP). We create a single cohesive low-dimensional representation of the resulting protein space. Our results show that, while each database occupies distinct regions within the protein structure space, they collectively exhibit significant overlap in their functional potential. High-level biological functions tend to cluster in particular regions, revealing a shared functional landscape despite the diverse sources of data. To facilitate exploration and improve access to our data, we developed an open-access web server. Our findings lay the groundwork for more in-depth studies concerning protein sequence-structure-function relationships, where various biological questions can be asked about taxonomic assignments, environmental factors, or functional specificity.Competing Interest StatementThe authors have declared no competing interest.},
	journal = {bioRxiv},
	author = {Szczerbiak, Paweł and Szydlowski, Lukasz and Wydmański, Witold and Douglas Renfrew, P. and Leman, Julia Koehler and Kosciolek, Tomasz},
	year = {2024},
	note = {Publisher: Cold Spring Harbor Laboratory
\_eprint: https://www.biorxiv.org/content/early/2024/08/17/2024.08.14.607935.full.pdf},
}
```

## Contact

For questions or support, please contact: wwydmanski@gmail.com
