import { Fade, Card, Autocomplete, TextField, Stack, Typography, Switch } from '@mui/material';
import { SOURCES, SOURCE_MAPPING, ANNOTATION_MAPPING, TAXONOMY_MAPPING, X_START, SearchMode, DJANGO_HOST } from '../utils/consts.js';
import React from 'react';

const Search = ({ 
    selectionMode,
    setSelectionMode,
    setSelectedItem,
    setGoTerm,
    setAspect,
    selectedGoTermValue,
    setSelectedGoTermValue,
    selectedItem,
    autocomplete,
    setAutocomplete,
    onClick,
    host
}: {
    selectionMode: any,
    setSelectionMode: (mode: any) => void,
    setSelectedItem: (item: any) => void,
    setGoTerm: (term: string) => void,
    setAspect: (aspect: string) => void,
    selectedGoTermValue: any,
    setSelectedGoTermValue: (value: any) => void,
    selectedItem: any,
    autocomplete: any[],
    setAutocomplete: (data: any[]) => void,
    onClick: (item: any) => void,
    host: string
} ) => {
    const nameSearchUrl = `${host}/name_search`;
    const goTermSearchUrl = `${host}/goterm_autocomplete`;

    return(
        <Fade in={true} timeout={800}>
            <Card sx={{
                overflow: "hidden",
                borderRadius: "10px",
                zIndex: 2,
                margin: "10px",
                padding: "10px",
                width: "fit-content",
            }}>
                {selectionMode === SearchMode.NAME && (
                <Autocomplete
                    disablePortal
                    id="name-select"
                    options={autocomplete}
                    sx={{ width: 400 }}
                    renderInput={(params: any) => <TextField {...params} label="Search by name" />}
                    getOptionLabel={(option: any) => option.protein}
                    onChange={(e: any, value: any) => {
                    if (value) {
                        setSelectedItem(value);
                        onClick(value);
                    }
                    }}
                    onInputChange={(e: any, value: any) => {
                    fetch(`${nameSearchUrl}?name=${value}`)
                        .then(res => res.json())
                        .then(data => {
                        setAutocomplete(data);
                        });
                    }}
                />
                )}
                {selectionMode === SearchMode.GOTERM && (
                <Autocomplete
                    disablePortal
                    id="goterm-select"
                    options={autocomplete}
                    sx={{ width: 400 }}
                    value={selectedGoTermValue}
                    renderInput={(params: any) => <TextField {...params} label="Search by function" />}
                    getOptionLabel={(option: any) => option.GOname}
                    onChange={(e: any, value: any) => {
                    if (value) {
                        setGoTerm(value.GOterm);
                        setAspect(value.Ontology);
                        setSelectedGoTermValue(value);
                    } else {
                        setGoTerm("");
                        setAspect("");
                        setSelectedGoTermValue(null);
                    }
                    }}
                    onInputChange={(e: any, value: any) => {
                    fetch(`${goTermSearchUrl}?goterm=${value}`)
                        .then(res => res.json())
                        .then(data => {
                        setAutocomplete(data);
                        });
                    }}
                    onOpen={() => {
                        fetch(`${goTermSearchUrl}?goterm=`)
                        .then(res => res.json())
                        .then(data => setAutocomplete(data));
                    }}
                />
                )}
                <Stack direction="row" spacing={2} marginTop="6px" justifyContent={"end"}>
                <Typography variant="body2" alignContent={"center"} color={selectionMode === SearchMode.NAME ? "primary" : "text.secondary"}>
                    Name
                </Typography>
                <Switch
                    checked={selectionMode === SearchMode.GOTERM}
                    onChange={(e: any) => {
                    setSelectionMode(e.target.checked ? SearchMode.GOTERM : SearchMode.NAME);
                    setGoTerm("");
                    setAspect("");
                    setSelectedItem(null);
                    }}
                />
                <Typography variant="body2" alignContent={"center"} color={selectionMode === SearchMode.GOTERM ? "primary" : "text.secondary"}>
                    Function
                </Typography>
                </Stack>
            </Card>
        </Fade>
    )
    
}

export default Search;