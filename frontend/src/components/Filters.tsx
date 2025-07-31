import React from "react";
import { Stack, Fade, Card, Typography, Box, Slider, Select, MenuItem, FormGroup, FormControlLabel, Checkbox } from '@mui/material';;
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
    return (
        <Stack direction="column" spacing={1} sx={{
          position: "absolute",
          bottom: "10px",
          right: "16px",
          overflow: "hidden",
          margin: "0",
          justifyContent: "end",
          maxWidth: "450px",
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
                    <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>AFDB pLDDT</Typography>
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
                      }}
                      size="small"
                      marks={[
                        { value: 20, label: '20' },
                        { value: 100, label: '100' }
                      ]}
                    />
                  </Box>
                  
                  <Box sx={{ width: "50%" }}>
                    <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>Length</Typography>
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
                <Stack direction="row" spacing={2} sx={{ mt: 1, px: 1 }}>
                  {/* Taxonomy Filter */}
                  <Box sx={{ width: "33.3%" }}>
                    <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>Taxonomy</Typography>
                    <Select
                      value={taxonomy}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTaxonomy(typeof value === "string" ? value.split(",") : value);
                      }}
                      size="small"
                      fullWidth
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <MenuItem value={"taxonomy"}>Taxonomy</MenuItem>
                      <Box pl={1} sx={{ maxHeight: '200px', overflow: 'auto' }}>
                        <FormGroup sx={{ p: 1.5 }}>
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
                                  if (checked) {
                                    setTaxonomy([...taxonomy, tax]);
                                  } else {
                                    setTaxonomy(taxonomy.filter((t) => t !== tax));
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
                  <Box sx={{ width: "33.3%" }}>
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
                                  if (checked) {
                                    setSupercog([...supercog, scog]);
                                  } else {
                                    setSupercog(supercog.filter((s) => s !== scog));
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
                  <Box sx={{ width: "33.3%" }}>
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
                                  if (checked) {
                                    setSelectedSources([...selectedSources, source]);
                                  } else {
                                    setSelectedSources(selectedSources.filter((s) => s !== source));
                                  }
                                }}
                              />
                            ))
                          }
                        </FormGroup>
                      </Box>
                    </Select>
                  </Box>
                </Stack>
              </Stack>
            </Card>
          </Fade>
        </Stack>
    )
}

export default Filters;