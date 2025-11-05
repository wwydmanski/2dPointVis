import React, { useMemo } from 'react';
import './App.css'
import { ThemeProvider } from '@mui/material/styles';
import Card from '@mui/material/Card';
import { debounce } from 'lodash';
import { Box, Stack, Fade, CircularProgress } from '@mui/material';
import { SOURCES, SOURCE_MAPPING, ANNOTATION_MAPPING, TAXONOMY_MAPPING, SearchMode, DJANGO_HOST } from './utils/consts';
import renderProtein from './utils/renderProtein';
import Chart from './components/Chart';
import Search from './components/Search';
import ProteinCard from './components/ProteinCard';
import ProteinsInClusterCard from './components/ProteinsInClusterCard';
import GoTermDetails from './components/GoTermDetails';
import Filters from './components/Filters';
import BottomMenu from './components/BottomMenu';
import { theme } from './utils/theme';

function App() {
  const [data, setData] = React.useState(null);
  var [currentCluster, setCurrentCluster] = React.useState("Everything");
  const [selectedSources, setSelectedSources] = React.useState(SOURCES);
  const [lengthRange, setlengthRange] = React.useState([0, 2700]);
  const [pLDDT, setPLDDT] = React.useState([20, 100]);
  const [supercog, setSupercog] = React.useState(Object.keys(ANNOTATION_MAPPING));
  const [taxonomy, setTaxonomy] = React.useState(Object.keys(TAXONOMY_MAPPING));
  const [autocomplete, setAutocomplete] = React.useState([]);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [zoomedItem, setZoomedItem] = React.useState(null);
  const [selectionMode, setSelectionMode] = React.useState(SearchMode.NAME);
  const [goTerm, setGoTerm] = React.useState("");
  const [aspect, setAspect] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [goTermDetails, setGoTermDetails] = React.useState(null);
  const [selectedGoTermValue, setSelectedGoTermValue] = React.useState(null);
  const [selectedNonRepresentative, setSelectedNonRepresentative] = React.useState(null);
  const [viewport, setViewport] = React.useState([-20, 20, -30, 20])
  const [pointIds, setPointIds] = React.useState([])

  // Update this useEffect to fetch GO term details when a protein is selected
  const host = typeof DJANGO_HOST === "string" && DJANGO_HOST.length > 0
    ? DJANGO_HOST + "/api"
    : window.location.origin + "/api";

  React.useEffect(() => {
    if (data && data.protein) {
      let name = data.protein.includes("-") ? data.protein.split("-")[1] : data.protein;
      if (selectedNonRepresentative) {
        name = selectedNonRepresentative;
      }

      // Use the protein name to fetch GO terms
      fetch(`${host}/goterm/${name}`)
        .then(res => res.json())
        .then(goData => {
          setGoTermDetails(goData);
        })
        .catch(err => {
          console.error("Error fetching GO term details:", err);
          setGoTermDetails(null);
        });
    } else {
      setGoTermDetails(null);
    }
  }, [data, selectedNonRepresentative]); // Now triggered when data changes

  const onClick = useMemo(() => {
    const debouncedHandler = debounce((datum) => {
      if (datum === null || datum === undefined) {
        setSelectedItem(null);
        setData(null);
        renderProtein(null);
        return;
      }

      const params = new URLSearchParams({
        name: datum.protein,
        x0: viewport[0],
        x1: viewport[1],
        y0: viewport[2],
        y1: viewport[3],
        types: selectedSources.join(","),
        lengthRange: `${lengthRange[0]},${lengthRange[1]}`,
        pLDDT: `${pLDDT[0]},${pLDDT[1]}`,
        supercog: supercog.join(","),
        taxonomy: taxonomy.join(","),
      });

      setSelectedNonRepresentative(datum.protein);
      setSelectedItem(datum);

      // Fetch the main data
      fetch(`${host}/name_search?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          datum.others = data[0].others;
          setData(datum);
        });

      // Fetch PDB data
      fetch(`${host}/pdb_loc/${datum.protein}`)
        .then((res) => res.json())
        .then((pdb_loc) => {
          renderProtein(pdb_loc);
        });
    }, 2000, { leading: true, trailing: true });

    return (datum) => {
      debouncedHandler(datum);
    };
  }, [viewport, selectedSources, lengthRange, pLDDT, supercog, taxonomy]);

  function handleSearching(foundItem) {
    setSelectedItem(foundItem);
    setZoomedItem(foundItem);
  }


  let name = data?.representative;
  if (data?.origin.includes("AFDB"))
    if (name.match(/-/g)?.length > 1)
      name = name.split("-")[1];

  let currentGoTermProtein = data?.representative;
  if (selectedNonRepresentative) {
    currentGoTermProtein = selectedNonRepresentative;
  }

  let type = SOURCE_MAPPING[data?.origin];

  return (
    <ThemeProvider theme={theme}>
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '20px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <CircularProgress sx={{ color: theme.palette.primary.main }} />
        </Box>
      )}
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
        <Chart
          selectedType={selectedSources}
          selectionCallback={onClick}
          lengthRange={lengthRange}
          pLDDT={pLDDT}
          supercog={supercog}
          foundItem={selectedItem}
          goTerm={goTerm}
          aspect={aspect}
          setIsLoading={setIsLoading}
          taxonomy={taxonomy}
          zoomedItem={zoomedItem}
          setViewport={setViewport}
          viewport={viewport}
          setPointIds={setPointIds}
        />
        <Stack direction="column" spacing={2} sx={{
          position: "absolute",
          top: "10px",
          left: "16px",
          overflow: "hidden",
          margin: "0",
          justifyContent: "start",
          width: "fit-content",
        }}>
          {/* Search Component */}
          <Search 
            autocomplete={autocomplete} 
            setSelectedItem={handleSearching} 
            onClick={onClick} 
            setAutocomplete={setAutocomplete} 
            setSelectionMode={setSelectionMode} 
            setGoTerm={setGoTerm} 
            setAspect={setAspect}
            selectionMode={selectionMode}
            selectedGoTermValue={selectedGoTermValue}
            setSelectedGoTermValue={setSelectedGoTermValue}
            host={host}
            viewport={viewport}
            selectedSources={selectedSources}
            lengthRange={lengthRange}
            pLDDT={pLDDT}
            supercog={supercog}
            taxonomy={taxonomy}
          />

          {/* Info Box & Proteins in Cluster */}
          <Fade in={true} timeout={1000}>
            <Stack direction="column" spacing={2} sx={{ mb: 2 }}>
              {/* Row with Representative Protein and Proteins in Cluster cards */}
              <Stack direction="row" spacing={2} sx={{ mx: 1, maxHeight: 270 }} style={{ width: "600px"}}>
                {/* Representative Protein Card */}
                <ProteinCard
                  name={name}
                  type={type}
                  data={data}
                  host={host}
                  renderProtein={renderProtein}
                  selectedNonRepresentative={selectedNonRepresentative}
                  setSelectedNonRepresentative={setSelectedNonRepresentative}
                />

                {/* Proteins in Cluster Card */}
                {data ? (
                  <ProteinsInClusterCard
                    data={data}
                    selectedNonRepresentative={selectedNonRepresentative}
                    setSelectedNonRepresentative={setSelectedNonRepresentative}
                    renderProtein={renderProtein}
                    host={host}
                    setData={setData}
                  />
                ) : <Box sx={{ width: "50%" }}></Box>}
              </Stack>

              {/* GO Term Details Card */}
              {goTermDetails && (
                <GoTermDetails
                  goTermDetails={goTermDetails}
                  currentGoTermProtein={currentGoTermProtein}
                  setSelectedGoTermValue={setSelectedGoTermValue}
                  setGoTerm={setGoTerm}
                  setAspect={setAspect}
                  setSelectionMode={setSelectionMode}
                  host={host}
                />
              )}
            </Stack>
          </Fade>
        </Stack>

        {/* PDB Viewer */}
        <Fade in={true} timeout={1200}>
          <Card sx={{
            position: "absolute",
            overflow: "hidden",
            borderRadius: "10px",
            zIndex: 1,
            margin: "10px",
            padding: "0px",
            top: "10px",
            right: "6px",
          }}>
            <div id="viewer-dom" style={{ width: "300px", height: "300px" }}></div>
          </Card>
        </Fade>

        {/* Filters */}
        <Filters
          pLDDT={pLDDT}
          setPLDDT={setPLDDT}
          lengthRange={lengthRange}
          setlengthRange={setlengthRange}
          taxonomy={taxonomy}
          setTaxonomy={setTaxonomy}
          supercog={supercog}
          setSupercog={setSupercog}
          selectedSources={selectedSources}
          setSelectedSources={setSelectedSources}
          setCurrentCluster={setCurrentCluster}       
        />

        
        <BottomMenu 
          pLDDT={pLDDT}
          lengthRange={lengthRange}
          taxonomy={taxonomy}
          supercog={supercog}
          selectedSources={selectedSources}
          x0={viewport[0]}
          x1={viewport[1]}
          y0={viewport[2]}
          y1={viewport[3]}
          goTerm={goTerm}
          ontology={aspect}
          pointIds={pointIds}
        />
      </Box >
    </ThemeProvider >
  )
}

export default App