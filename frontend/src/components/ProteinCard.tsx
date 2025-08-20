import React from 'react';
import { Card, Typography, Stack, Box, Button } from '@mui/material';
import { ANNOTATION_MAPPING, DJANGO_HOST } from '../utils/consts.js';
import DownloadIcon from '@mui/icons-material/Download';

const ProteinCard = (
    { data, name, type, selectedNonRepresentative, host = DJANGO_HOST } : {
        data: any,
        name: string,
        type: string,
        selectedNonRepresentative?: string,
        host?: string
    }
) => {
    return (
        <Card sx={{
        overflow: "hidden",
        borderRadius: "10px",
        zIndex: 1,
        padding: "10px",
        width: "50%",
        }}>
            <Typography variant="h6" gutterBottom>
                Representative protein
            </Typography>
            <Typography variant="body2" component="div">
                {
                data ? (
                    <Stack direction="column" spacing={1}>
                    <Box>Name: {name}</Box>
                    <Box>Database: {type}</Box>
                    <Box sx={{ overflowX: "auto", whiteSpace: "nowrap" }}>Origin: {data.taxonomy_name}</Box>
                    <Box>Length: {data.length}</Box>
                    {/* @ts-ignore */}
                    <Box>deepFRI v1.0: {ANNOTATION_MAPPING[data["superCOG_v10"]]}</Box>
                    {/* @ts-ignore */}
                    <Box>deepFRI v1.1: {ANNOTATION_MAPPING[data["superCOG_v11"]]}</Box>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        // @ts-ignore
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                        const nameToDownload = selectedNonRepresentative ? selectedNonRepresentative : name;
                        fetch(`${host}/pdb_loc/${nameToDownload}`)
                            .then(res => res.json())
                            .then(pdb_loc => {
                            const url = `${host}/pdb/${pdb_loc}`;

                            const fname = pdb_loc.split("/")[pdb_loc.split("/").length - 1];

                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${fname}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            });
                        }}
                        sx={{ mt: 1 }}
                    >
                        Download PDB
                    </Button>
                    </Stack>
                ) : "No protein selected"
                }
            </Typography>
        </Card>
    );
}

export default ProteinCard;