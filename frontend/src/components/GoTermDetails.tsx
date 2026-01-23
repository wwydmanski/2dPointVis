import React from "react";
import { Card, Typography, Box, Stack } from '@mui/material';
import { SearchMode } from "../utils/consts.js";

const GoTermDetails = ({
    goTermDetails,
    currentGoTermProtein,
    setGoTerm,
    setAspect,
    setSelectionMode,
    setSelectedGoTermValue
}: {
    goTermDetails: any[],
    currentGoTermProtein: string,
    setGoTerm: (goId: string) => void,
    setAspect: (aspect: string) => void,
    setSelectionMode: (mode: string) => void,
    setSelectedGoTermValue: (value: any) => void
}) => {
    return (
        <Card sx={{
        overflow: "auto",
        borderRadius: "10px",
        zIndex: 1,
        margin: "10px",
        padding: "10px",
        width: "400px",
        maxHeight: "300px"
        }}>
            <Typography variant="h6" gutterBottom>
                Function predictions ({currentGoTermProtein})
            </Typography>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                mt: 2
            }}>
                {goTermDetails.map((term, index) => (
                <Box
                    key={index}
                    sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                        bgcolor: 'action.hover',
                        cursor: 'pointer'
                    }
                    }}
                    onClick={() => {
                    const selectedTermObj = {
                        GOterm: term.go_id,
                        GOname: term.name,
                        Ontology: term.ontology
                    };
                    setGoTerm(term.go_id);
                    setAspect(term.ontology);
                    setSelectionMode(SearchMode.GOTERM);
                    setSelectedGoTermValue(selectedTermObj);
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight="medium">
                        {term.name} ({term.go_id})
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                        bgcolor: term.ontology === 'MF' ? 'primary.main' :
                            term.ontology === 'BP' ? 'secondary.main' : 'success.main',
                        color: 'white',
                        px: 1,
                        py: 0.2,
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                        }}
                    >
                        {term.ontology}
                    </Typography>
                    </Stack>
                    <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Score:
                    </Typography>
                    <Box sx={{
                        width: '100%',
                        height: 4,
                        bgcolor: 'background.default',
                        mt: 0.5,
                        position: 'relative',
                        borderRadius: 1
                    }}>
                        <Box sx={{
                        position: 'absolute',
                        height: '100%',
                        width: `${term.score * 100}%`,
                        bgcolor: term.score > 0.7 ? 'success.main' :
                            term.score > 0.4 ? 'warning.main' : 'error.main',
                        borderRadius: 1
                        }} />
                    </Box>
                    <Typography variant="caption" sx={{ float: 'right', mt: 0.5 }}>
                        {term.score.toFixed(2)}
                    </Typography>
                    </Box>
                </Box>
                ))}
            </Box>
        </Card>
    )
}

export default GoTermDetails;