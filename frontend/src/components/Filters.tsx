import React, { ChangeEvent, useState } from "react";
import { Stack, Fade, Card, Typography, Box, Slider, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, Button, Tooltip, TextField } from '@mui/material';;
import { TAXONOMY_MAPPING, ANNOTATION_MAPPING, SOURCES, SOURCE_MAPPING } from "../utils/consts.js";

export const Filters = ({
    pLDDT,
    setPLDDT,
    lengthRange,
    setlengthRange,
    taxonomy,
    setTaxonomy,
    supercog,
    setSupercog,
    selectedSources,
    setSelectedSources,
    setCurrentCluster
}: {
    pLDDT: number[],
    setPLDDT: (value: number[]) => void,
    lengthRange: number[],
    setlengthRange: (value: number[]) => void,
    taxonomy: string[],
    setTaxonomy: (value: string[]) => void,
    supercog: string[],
    setSupercog: (value: string[]) => void,
    selectedSources: string[],
    setSelectedSources: (value: string[]) => void,
    setCurrentCluster: (value: string) => void
}) => {
    const [taxonomyButtonLabel, setTaxonomyButtonLabel] = useState<"all" | "none">("none");
    const [supercogButtonLabel, setSupercogButtonLabel] = useState<"all" | "none">("none");
    const [databaseButtonLabel, setDatabaseButtonLabel] = useState<"all" | "none">("none");
    const [inputtedFromPLDDT, setInputtedFromPLDDT] = useState<number>(20)
    const [inputtedToPLDDT, setInputtedToPLDDT] = useState<number>(100)
    const [inputtedFromLength, setInputtedFromLength] = useState<number>(0)
    const [inputtedToLength, setInputtedToLength] = useState<number>(2700)
    const [openPLDDTTyping, setOpenPLDDTTyping] = useState<boolean>(false)
    const [openLengthTyping, setOpenLengthTyping] = useState<boolean>(false)

    const handleReset = () => {
      setlengthRange([0, 2700])
      setPLDDT([20, 100])
      setTaxonomy(Object.keys(TAXONOMY_MAPPING))
      setSupercog(Object.keys(ANNOTATION_MAPPING))
      setSelectedSources(SOURCES)
      setTaxonomyButtonLabel("none");
      setDatabaseButtonLabel("none");
      setSupercogButtonLabel("none");
    }

    const handleTaxonomyButtonClick = () => {
      if(taxonomyButtonLabel === "none") {
        setTaxonomy([])
        setTaxonomyButtonLabel("all")
      }
      else {
        setTaxonomy(Object.keys(TAXONOMY_MAPPING))
        setTaxonomyButtonLabel("none")
      }
    }

    const handleSupercogButtonClick = () => {
      if(supercogButtonLabel === "none") {
        setSupercog([])
        setSupercogButtonLabel("all")
      }
      else {
        setSupercog(Object.keys(ANNOTATION_MAPPING))
        setSupercogButtonLabel("none")
      }
    }

    const handleDatabaseButtonClick = () => {
      if(databaseButtonLabel === "none") {
        setSelectedSources([])
        setDatabaseButtonLabel("all")
      }
      else {
        setSelectedSources(SOURCES)
        setDatabaseButtonLabel("none")
      }
    }

    const handleChangeFromPLDDTInput = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = parseInt(event.target.value, 10);
        setInputtedFromPLDDT(value)
        if(value < pLDDT[1] && value >= 20) {
          setPLDDT([value, pLDDT[1]]);
        }
    }

    const handleChangeToPLDDTInput = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = parseInt(event.target.value, 10);
        setInputtedToPLDDT(value)
        if(value > pLDDT[0] && value <= 100) {
          setPLDDT([pLDDT[0], value]);
        }
    }

    const handleChangeFromLengthInput = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = parseInt(event.target.value, 10);
        setInputtedFromLength(value)
        if(value < lengthRange[1] && value >= 0) {
          setlengthRange([value, lengthRange[1]]);
        }
    }

    const handleChangeToLengthInput = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = parseInt(event.target.value, 10);
        setInputtedToLength(value)
        if(value > lengthRange[0] && value <= 2700) {
          setlengthRange([lengthRange[0], value])
        }
    }

    return (
        <Stack direction="column" spacing={1} sx={{
          position: "absolute",
          bottom: "10px",
          right: "16px",
          overflow: "hidden",
          margin: "0",
          justifyContent: "end",
          width: "450px",
          pointerEvents: "none"
        }}
        >
          <Fade in={true} timeout={1600}>
            <Card sx={{
              margin: "0",
              padding: "16px",
              overflow: "hidden",
              borderRadius: "10px",
              zIndex: 1,
              pointerEvents: "all"
            }}>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 1.5, px: 1 }}>
                Filters
              </Typography>
              
              <Stack direction="column" spacing={2.5}>
                {/* AFDB pLDDT and Length Sliders */}
                <Stack direction="row" spacing={3} sx={{ px: 1 }}>
                  <Box sx={{ width: "50%" }}>
                    <span style={{ marginBottom: 5, display: 'flex', flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
                      <Typography variant="body2">AFDB pLDDT</Typography>
                      <Tooltip 
                      open={openPLDDTTyping}
                      onClose={() => setOpenPLDDTTyping(false)}
                      arrow
                      disableHoverListener
                      title={
                        <span style={{ display: 'flex', flexDirection: 'row', columnGap: 10 }}>
                          <TextField label='From' type="number" variant="outlined" size="small" value={inputtedFromPLDDT} onChange={handleChangeFromPLDDTInput} />
                          <TextField label='To' type="number" variant="outlined" size="small" value={inputtedToPLDDT} onChange={handleChangeToPLDDTInput} />
                        </span>
                      }
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            boxShadow: 3,
                            opacity: 1,
                            padding: 1
                          },
                        },
                      }}>
                        <Button style={{ padding: 1 }} onClick={() => setOpenPLDDTTyping(true)}>Type</Button>
                      </Tooltip>
                    </span>
                    
                    <Slider
                      defaultValue={[20, 100]}
                      value={pLDDT}
                      min={20}
                      max={100}
                      valueLabelDisplay="auto"
                      aria-labelledby="plddt-range-slider"
                      getAriaValueText={(value: any) => value}
                      onChange={(e: any, value: number[]) => {
                        setPLDDT(value);
                        setInputtedFromPLDDT(value[0])
                        setInputtedToPLDDT(value[1])
                      }}
                      size="small"
                      marks={[
                        { value: 20, label: '20' },
                        { value: 100, label: '100' }
                      ]}
                    />
                  </Box>
                  
                  <Box sx={{ width: "50%" }}>
                    <span style={{ marginBottom: 5, display: 'flex', flexDirection: 'row', alignItems: 'center', columnGap: 5 }}>
                      <Typography variant="body2">Length</Typography>
                      <Tooltip 
                      open={openLengthTyping}
                      onClose={() => setOpenLengthTyping(false)}
                      arrow
                      disableHoverListener
                      title={
                        <span style={{ display: 'flex', flexDirection: 'row', columnGap: 10 }}>
                          <TextField label='From' type="number" variant="outlined" size="small" value={inputtedFromLength} onChange={handleChangeFromLengthInput} />
                          <TextField label='To' type="number" variant="outlined" size="small" value={inputtedToLength} onChange={handleChangeToLengthInput} />
                        </span>
                      }
                      slotProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'background.paper',
                            color: 'text.primary',
                            boxShadow: 3,
                            opacity: 1,
                            padding: 1
                          },
                        },
                      }}
                      >
                        <Button style={{ padding: 1 }} onClick={() => setOpenLengthTyping(true)}>Type</Button>
                      </Tooltip>
                    </span>
                    
                    <Slider
                      defaultValue={[0, 2700]}
                      value={lengthRange}
                      min={0}
                      max={2700}
                      valueLabelDisplay="auto"
                      aria-labelledby="length-range-slider"
                      getAriaValueText={(value: any) => value}
                      onChange={(e: any, value: number[]) => {
                        setlengthRange(value);
                        setInputtedFromLength(value[0])
                        setInputtedToLength(value[1])
                      }}
                      size="small"
                      marks={[
                        { value: 0, label: '0' },
                        { value: 2700, label: '2700' }
                      ]}
                    />
                  </Box>
                </Stack>
                
                {/* Dropdown Filters */}
                <Stack direction="row" spacing={1} sx={{ mt: 1, px: 1 }}>
                  {/* Taxonomy Filter */}
                  <Box sx={{ width: "29%" }}>
                    <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>Taxonomy</Typography>
                    <Select
                      value={"taxonomy"}
                      onChange={(e: any) => {
                        setTaxonomy(e.target.value);
                      }}
                      size="small"
                      fullWidth
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <MenuItem value={"taxonomy"}>Taxonomy</MenuItem>
                      <Box pl={1} sx={{ maxHeight: '200px', overflow: 'auto' }}>
                        <FormGroup sx={{ p: 1.5 }}>
                          <Button onClick={handleTaxonomyButtonClick}>{taxonomyButtonLabel}</Button>
                          {
                            Object.keys(TAXONOMY_MAPPING).map((tax, i) => (
                              <FormControlLabel key={i} control={
                                <Checkbox
                                  checked={taxonomy.includes(tax)}
                                  size="small"
                                />
                                // @ts-ignore
                              } label={<Typography variant="body2">{TAXONOMY_MAPPING[tax]}</Typography>}
                                value={tax}
                                onChange={(_event, checked: boolean) => {
                                  const newTaxonomy = checked ? [...taxonomy, tax] : taxonomy.filter((t) => t !== tax)
                                  setTaxonomy(newTaxonomy);
                                  if(newTaxonomy.length === Object.keys(TAXONOMY_MAPPING).length) {
                                    setTaxonomyButtonLabel("none")
                                  }
                                  else {
                                    setTaxonomyButtonLabel("all")
                                  }
                                }}
                              />
                            ))
                          }
                        </FormGroup>
                      </Box>
                    </Select>
                  </Box>
                  
                  {/* superCOG Filter */}
                  <Box sx={{ width: "29%" }}>
                    <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>superCOG</Typography>
                    <Select
                      value={"superCOG"}
                      onChange={(e: { target: { value: any; }; }) => {
                        setCurrentCluster(e.target.value);
                      }}
                      size="small"
                      fullWidth
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <MenuItem value={"superCOG"}>superCOG</MenuItem>
                      <Box pl={1} sx={{ maxHeight: '200px', overflow: 'auto' }}>
                        <FormGroup sx={{ p: 1.5 }}>
                          <Button onClick={handleSupercogButtonClick}>{supercogButtonLabel}</Button>
                          {
                            Object.keys(ANNOTATION_MAPPING).map((scog, i) => (
                              <FormControlLabel key={i} control={
                                <Checkbox
                                  checked={supercog.includes(scog)}
                                  size="small"
                                />
                                // @ts-ignore
                              } label={<Typography variant="body2">{ANNOTATION_MAPPING[scog]}</Typography>}
                                value={scog}
                                onChange={(_event, checked: boolean) => {
                                  const newSupercog = checked ? [...supercog, scog] : supercog.filter((s) => s !== scog)
                                  setSupercog(newSupercog);
                                  if(newSupercog.length === Object.keys(ANNOTATION_MAPPING).length) {
                                    setSupercogButtonLabel("none")
                                  }
                                  else {
                                    setSupercogButtonLabel("all")
                                  }
                                }}
                              />
                            ))
                          }
                        </FormGroup>
                      </Box>
                    </Select>
                  </Box>
                  
                  {/* Database Filter */}
                  <Box sx={{ width: "29%" }}>
                    <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>Database</Typography>
                    <Select
                      value={"Origin"}
                      onChange={(e: { target: { value: any; }; }) => {
                        setCurrentCluster(e.target.value);
                      }}
                      size="small"
                      fullWidth
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <MenuItem value={"Origin"}>Database</MenuItem>
                      <Box pl={1} sx={{ maxHeight: '200px', overflow: 'auto' }}>
                        <FormGroup sx={{ p: 1.5 }}>
                          <Button onClick={handleDatabaseButtonClick}>{databaseButtonLabel}</Button>
                          {
                            SOURCES.map((source, i) => (
                              <FormControlLabel key={i} control={
                                <Checkbox
                                  checked={selectedSources.includes(source)}
                                  size="small"
                                />
                                // @ts-ignore
                              } label={<Typography variant="body2">{SOURCE_MAPPING[source]}</Typography>}
                                value={source}
                                onChange={(_event, checked: boolean) => {
                                  const newDatabases = checked ? [...selectedSources, source] : selectedSources.filter((s) => s !== source)
                                  setSelectedSources(newDatabases);
                                  if(newDatabases.length === SOURCES.length) {
                                    setDatabaseButtonLabel("none")
                                  }
                                  else {
                                    setDatabaseButtonLabel("all")
                                  }
                                }}
                              />
                            ))
                          }
                        </FormGroup>
                      </Box>
                    </Select>
                  </Box>
                  <Box sx={{ width: "13%" }}>
                    <Button onClick={handleReset} sx={{mt: 3.5}}>
                        Reset
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            </Card>
          </Fade>
        </Stack>
    )
}

export default Filters;