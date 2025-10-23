import { Box, Button, Checkbox, CircularProgress, FormControlLabel, FormGroup, Modal, Tooltip, Typography } from "@mui/material";
import React, { useState } from "react";
import { DJANGO_HOST } from "../utils/consts.js";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const CsvButton = ({
  pLDDT,
  lengthRange,
  taxonomy,
  supercog,
  selectedSources,
  x0,
  x1,
  y0,
  y1,
  goTerm,
  ontology,
  pointIds
}:{
  pLDDT: number[],
  lengthRange: number[],
  taxonomy: string[],
  supercog: string[],
  selectedSources: string[],
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  goTerm: string,
  ontology: string,
  pointIds: string[]
}) => {
    const modalBoxStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 500,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    const COLUMNS = {
        "Protein ID (protein_id)": "protein_id",
        "Database (database)": "database",
        "Cluster representative ID (repr_protein_id)": "repr_protein_id",
        "Horizontal coordinate (x)": "x",
        "Vertical coordinate (y)": "y",
        "Protein length (length)": "length",
        "AFDB protein pLDDT (afdb_pLDDT)": "afdb_pLDDT",
        "superCOG predicted by deepFRI v1.0 (superCOG_v10)": "superCOG_v10",
        "superCOG predicted by deepFRI v1.1 (superCOG_v11)": "superCOG_v11",
        "Taxonomic category (taxonomy)": "taxonomy",
        "Sequence origin (origin)": "origin",
        "URL (url)": "url"
    }

    const [chosenColumns, setChosenColumns] = useState(Object.values(COLUMNS))
    const [onlyVisibleVertices, setOnlyVisibleVertices] = useState(false)
    const [onlyRepresentatives, setOnlyRepresentatives] = useState(false)
    const [waitingForResponse, setWaitingForResponse] = useState(false)
    const [pollingCounter, setPollingCounter] = useState(0)

    const host = typeof DJANGO_HOST === "string" && DJANGO_HOST.length > 0
        ? DJANGO_HOST + "/api"
        : window.location.origin + "/api";
    
    const [showModal, setShowModal] = useState(false)

    const handleExportClick = async (loadIds: boolean, onlyRepresentatives: boolean) => {
        const filters = {
            pLDDT: pLDDT,
            lengthRange: lengthRange,
            taxonomy: taxonomy,
            supercog: supercog,
            selectedSources: selectedSources,
            x0: x0,
            x1: x1,
            y0: y0,
            y1: y1,
            goTerm: goTerm,
            ontology: ontology,
            ids: loadIds ? pointIds : [],
            columnNames: chosenColumns,
            onlyRepresentatives: onlyRepresentatives
        };

        setWaitingForResponse(true);

        const startResponse = await fetch(`${host}/export_to_tsv/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({filters})
        });

        const { job_id } = await startResponse.json();

        const pollStatus = async (pollingCounter: number) => {
            const res = await fetch(`${host}/export_to_tsv/status/${job_id}`);
            const data = await res.json();
            if (data.status === "ready") {
                window.open(`${host}/export_to_tsv/download/${job_id}`, "_blank");
                setWaitingForResponse(false);
                setPollingCounter(0)
                setShowModal(false);
            } else {
                console.log(pollingCounter)
                setPollingCounter(pollingCounter + 1)
                setTimeout(() => pollStatus(pollingCounter + 1), 2000);
            }
        };

        pollStatus(0);
    };


    return (
        <div>
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={modalBoxStyle}>
                    <Typography variant="h6" component="h2">
                        Exporting to TSV File
                    </Typography>
                    <Typography>Select columns for export</Typography>
                    <Box pl={1} sx={{ maxHeight: '200px', overflow: 'auto', bgcolor: "#5555", mt: 2, borderRadius: 4, mb: 2 }}>
                        <FormGroup sx={{ p: 1.5 }}>
                            {Object.keys(COLUMNS).map((column: string, i) => (
                                <FormControlLabel 
                                    key={i} 
                                    control={
                                        <Checkbox
                                            // @ts-ignore
                                            checked={chosenColumns.includes(COLUMNS[column])}
                                            size="small"
                                        />
                                        
                                    }
                                    // @ts-ignore
                                    label={<Typography variant="body2">{column}</Typography>}
                                    value={column}
                                    onChange={(_event, checked: boolean) => {
                                        // @ts-ignore
                                        const columnString = COLUMNS[column];
                                        const newChosenColumns = checked ? [...chosenColumns, columnString] : chosenColumns.filter((c) => c !== columnString)
                                        setChosenColumns(newChosenColumns)
                                    }}
                                />
                            ))}
                        </FormGroup>
                    </Box>
                    <FormGroup>
                        <FormControlLabel 
                            control={
                                <Checkbox
                                    checked={onlyVisibleVertices}
                                    size="small"
                                />
                            }
                            label={
                                <div style={{display: 'flex', alignItems: 'center', columnGap: 5}}>
                                    <span>Only vertices visible on viewport</span>
                                    <Tooltip disableInteractive title="Save only visible points. (Note: by default, not all points are shown.)">
                                        {/* @ts-ignore */}
                                        <HelpOutlineIcon fontSize="small" />
                                    </Tooltip>
                                </div>
                            }
                            value={onlyVisibleVertices}
                            onChange={() => setOnlyVisibleVertices(!onlyVisibleVertices)}
                        />
                    </FormGroup>
                    <FormGroup>
                        <FormControlLabel 
                            control={
                                <Checkbox
                                    checked={onlyRepresentatives}
                                    size="small"
                                />
                            }
                            label={
                                <div style={{display: 'flex', alignItems: 'center', columnGap: 5}}>
                                    <span>Only cluster representatives</span>
                                    <Tooltip disableInteractive title="Save only the cluster representatives. When unchecked, cluster members are also saved, with their coordinates identical to those of their representatives. (Note: This may introduce bias in quantitative analyses, as the visualization is based solely on cluster representatives.)">
                                        {/* @ts-ignore */}
                                        <HelpOutlineIcon fontSize="small" />
                                    </Tooltip>
                                </div>
                            }
                            value={onlyRepresentatives}
                            onChange={() => setOnlyRepresentatives(!onlyRepresentatives)}
                        />
                    </FormGroup>
                    <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-end'}}>
                        <Button 
                            disabled={waitingForResponse} 
                            onClick={() => handleExportClick(onlyVisibleVertices, onlyRepresentatives)}
                        >
                            {waitingForResponse ? 
                                <CircularProgress size="30px" /> :
                                <span>Export</span>
                            }
                        </Button>
                    </Box>
                    <Box>
                        {pollingCounter > 2 ? 
                            <div style={{fontSize: "small"}}>Fetching data may take longer due to large size of blob. Please wait...</div>
                            : null
                        }
                    </Box>
                </Box>
            </Modal>
            <Button onClick={() => setShowModal(true)}>Export data</Button>
        </div>
    )
}

export default CsvButton;