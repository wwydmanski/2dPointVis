import { Box, Button, Checkbox, CircularProgress, FormControlLabel, FormGroup, Modal, Typography } from "@mui/material";
import React, { useState } from "react";
import { DJANGO_HOST } from "../utils/consts.js";

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
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    const COLUMNS = [
        "protein_id",
        "database",
        "repr_protein_id",
        "x",
        "y",
        "length",
        "afdb_pLDDT",
        "superCOG_v10",
        "superCOG_v11",
        "taxonomy",
        "origin",
        "url"
    ]

    const [chosenColumns, setChosenColumns] = useState(COLUMNS)
    const [onlyVisibleVertices, setOnlyVisibleVertices] = useState(true)
    const [onlyRepresentatives, setOnlyRepresentatives] = useState(true)
    const [waitingForResponse, setWaitingForResponse] = useState(false)

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

        try {
            setWaitingForResponse(true)
            const response = await fetch(`${host}/export_to_tsv`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(filters)
            });

            if (!response.ok) {
                throw new Error(`Błąd serwera: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "data.tsv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setWaitingForResponse(false)
            setShowModal(false)
        } catch (error) {
            console.error("Error on fetching:", error);
        }
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
                                    label={<Typography variant="body2">{COLUMNS[column]}</Typography>}
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
                            label="Only vertices visible on viewport"
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
                            label="Only cluster representatives"
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
                </Box>
            </Modal>
            <Button onClick={() => setShowModal(true)}>Export data</Button>
        </div>
    )
}

export default CsvButton;