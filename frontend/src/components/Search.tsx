import { Fade, Card, Autocomplete, TextField, Stack, Typography, Switch, RadioGroup, FormControlLabel, Radio, Tooltip, IconButton } from '@mui/material';
import { SOURCES, SOURCE_MAPPING, ANNOTATION_MAPPING, TAXONOMY_MAPPING, X_START, SearchMode, DJANGO_HOST } from '../utils/consts.js';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
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
    origin,
    setOrigin,
    host,
    viewport,
    selectedSources,
    lengthRange,
    pLDDT,
    supercog,
    taxonomy
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
    origin: string,
    setOrigin: (newOrigin: string) => void,
    host: string,
    viewport: number[],
    selectedSources: string[],
    lengthRange: number[],
    pLDDT: number[],
    supercog: string[],
    taxonomy: string[]
} ) => {
    const findProteinsByNameUrl = `${host}/find_proteins_by_name`;
    const nameSearchUrl = `${host}/name_search`
    const goTermSearchUrl = `${host}/goterm_autocomplete`;
    const findOriginsUrl = `${host}/find_origins`

    const tooltipTexts = {
        [SearchMode.NAME]: "Search by protein ID e.g. A0A2W5YLP2, MGYP002852702119, MIP_00087436 etc.",
        [SearchMode.GOTERM]: "Search by Gene Ontology function e.g. DNA binding, transcription regulator activity etc.",
        [SearchMode.ORIGIN]: "Search by protein organism/biom e.g. Chloroflexota bacterium, Thermus igniterrae, Human, Marine, Digestive system, Bioreactor, Unknown etc.",
    }

    const params = (name: string) => new URLSearchParams({
        name: name,
        x0: viewport[0].toString(),
        x1: viewport[1].toString(),
        y0: viewport[2].toString(),
        y1: viewport[3].toString(),
        types: selectedSources.join(","),
        lengthRange: `${lengthRange[0]},${lengthRange[1]}`,
        pLDDT: `${pLDDT[0]},${pLDDT[1]}`,
        supercog: supercog.join(","),
        taxonomy: taxonomy.join(","),
    })

    const handleSetSelectionMode = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectionMode(event.target.value);
        setGoTerm("");
        setAspect("");
        setSelectedItem(null);
    };

    return(
        <Fade in={true} timeout={800}>
            <Card sx={{
                overflow: "visible",
                borderRadius: "10px",
                zIndex: 2,
                margin: "10px",
                padding: "10px",
                width: "fit-content",
            }}>
                {selectionMode === SearchMode.NAME && (
                <Autocomplete
                    id="name-select"
                    options={autocomplete}
                    sx={{ width: 400 }}
                    ListboxProps={{
                        style: {
                            maxHeight: '300px'
                        }
                    }}
                    renderInput={(params: any) => <TextField {...params} label="Search by protein ID" />}
                    getOptionLabel={(option: any) => option.protein}
                    onChange={(e: any, value: any) => {
                        if (value && value['protein']) {
                            fetch(`${nameSearchUrl}?${params(value['protein']).toString()}`)
                                .then(res => res.json())
                                .then(newData => {
                                    setSelectedItem(newData[0].chosen_protein);
                                    onClick(newData[0].chosen_protein);
                                })
                        }
                    }}
                    onInputChange={(e: any, value: any) => {
                    fetch(`${findProteinsByNameUrl}?${params(value).toString()}`)
                        .then(res => res.json())
                        .then(data => {
                            setAutocomplete(data.map((e: any) => ({ "protein": e})));
                        });
                    }}
                />
                )}
                {selectionMode === SearchMode.GOTERM && (
                <Autocomplete
                    id="goterm-select"
                    options={autocomplete}
                    sx={{ width: 400 }}
                    value={selectedGoTermValue}
                    ListboxProps={{
                        style: {
                            maxHeight: '300px'
                        }
                    }}
                    renderInput={(params: any) => <TextField {...params} label="Search by Gene Ontology function" />}
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
                {selectionMode == SearchMode.ORIGIN && (
                <Autocomplete
                    id="origin-select"
                    options={autocomplete}
                    sx={{ width: 400 }}
                    value={origin}
                    ListboxProps={{
                        style: {
                            maxHeight: '300px'
                        }
                    }}
                    renderInput={(params: any) => <TextField {...params} label="Search by protein organism/biom" />}
                    getOptionLabel={(option: any) => option}
                    onChange={(e: any, value: any) => {
                        if (value) {
                            setOrigin(value)
                        }
                        else {
                            setOrigin("")
                        }
                    }}
                    onInputChange={(e: any, value: any) => {
                        fetch(`${findOriginsUrl}?origin=${value}`)
                        .then(res => res.json())
                        .then(data => {
                            setAutocomplete(data)
                        });
                    }}
                    onOpen={() => {
                        fetch(`${findOriginsUrl}?origin=`)
                        .then(res => res.json())
                        .then(data => setAutocomplete(data));
                    }}
                />
                )}
                <Stack direction="row" spacing={2} marginTop="6px" justifyContent={"space-between"}>
                    <Tooltip title={tooltipTexts[selectionMode]}>
                        <IconButton size="small">
                            {/* @ts-ignore */}
                            <QuestionMarkIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <RadioGroup 
                        style={{display: "flex", flexDirection: "row"}}
                        value={selectionMode}
                        onChange={handleSetSelectionMode}
                    >
                        <FormControlLabel value="name" control={<Radio />} label="Name" />
                        <FormControlLabel value="goterm" control={<Radio />} label="Function" />
                        <FormControlLabel value="origin" control={<Radio />} label="Origin" />
                    </RadioGroup>
                </Stack>
            </Card>
        </Fade>
    )
    
}

export default Search;