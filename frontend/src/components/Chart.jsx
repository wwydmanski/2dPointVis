import React from 'react';
import { XyScatterRenderableSeries, XyDataSeries, SweepAnimation, EllipsePointMarker, DataPointSelectionPaletteProvider, GenericAnimation, easing, NumberRangeAnimator, NumberRange, Logger } from "scichart";
import { prepareChart } from '../chartSetup';
import useWebSocket from 'react-use-websocket';
import { useCallback } from 'react';
import { debounce } from 'lodash';
import { DJANGO_HOST } from '../utils/consts';
import { Cosmograph, CosmographProvider } from '@cosmograph/react';
import { colorMap } from '../utils/consts';

export default function Chart({ selectedType, selectionCallback, lengthRange, pLDDT, supercog, foundItem, goTerm, aspect, setIsLoading, taxonomy }) {

  const [currentData, setCurrentData] = React.useState(undefined);
  const [visible, setVisible] = React.useState({
    x: { min: -20, max: 20 },
    y: { min: -30, max: 20 }
  });
  const [completedX, setCompletedX] = React.useState(false);
  const [completedY, setCompletedY] = React.useState(false);
  const [previousSelected, setPreviousSelected] = React.useState([]);
  const [lengthRangeState, setlengthRangeState] = React.useState([0, 2700]);
  const [pLDDTState, setPLDDTState] = React.useState([20, 100]);
  const [previousSupercog, setPreviousSupercog] = React.useState([]);
  const [backgroundData, setBackgroundData] = React.useState([]);
  const [streamingData, setStreamingData] = React.useState([]);
  const [previousGoTerm, setPreviousGoTerm] = React.useState("");
  const [previousAspect, setPreviousAspect] = React.useState("");
  const [previousTaxonomy, setPreviousTaxonomy] = React.useState([]);
  const [viewableData, setViewableData] = React.useState(undefined);

  const { sendMessage, lastMessage, readyState } = useWebSocket(`${window.location.protocol === 'https:' ? 'wss' : window.location.protocol === 'http:' ? 'ws' : 'ws'}://${DJANGO_HOST.replace("http://", "").replace("https://", "") || window.location.host}/ws/points`, {
    shouldReconnect: (closeEvent) => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: false,
  });

  const lastProcessedMessageRef = React.useRef(null);

  const debouncedSendMessage = useCallback(
    debounce((message) => {
      sendMessage(message);
      setIsLoading(true);
    }, 400),
    [sendMessage]
  );

  React.useEffect(() => {
    if(currentData) {
      const data = currentData
          .filter((d) => d.length >= lengthRange[0] && d.length <= lengthRange[1])
          .filter((d) => (d["afdb_pLDDT"] >= pLDDT[0] && d["afdb_pLDDT"] <= pLDDT[1]) || d["afdb_pLDDT"] === -1)
          .filter((d) => supercog.includes(d["superCOG_v10"]))
          .filter((d) => taxonomy.includes(d["taxonomy"]))
      data.map((element) => element["id"] = element["clean_name"])
      data.map((element) => element["color"] = colorMap[element["origin"]]);
      setViewableData(data);
    }
  }, [currentData, lengthRange, pLDDT, supercog, taxonomy]);

  React.useEffect(() => {
    if ((!completedX || !completedY) &&
      selectedType === previousSelected &&
      lengthRangeState[0] === lengthRange[0] && lengthRangeState[1] === lengthRange[1] &&
      pLDDTState[0] === pLDDT[0] && pLDDTState[1] === pLDDT[1] &&
      supercog === previousSupercog &&
      goTerm === previousGoTerm &&
      aspect === previousAspect &&
      taxonomy === previousTaxonomy
    ) return;

    const message = {
      x0: visible.x.min,
      x1: visible.x.max,
      y0: visible.y.min,
      y1: visible.y.max,
      types: selectedType,
      lengthRange: lengthRange,
      pLDDT: pLDDT,
      supercog: supercog,
      goTerm: goTerm,
      ontology: aspect,
      taxonomy: taxonomy
    };

    debouncedSendMessage(JSON.stringify(message));

    setCompletedX(false);
    setCompletedY(false);
    setPreviousSelected(selectedType);
    setlengthRangeState(lengthRange);
    setPLDDTState(pLDDT);
    setPreviousSupercog(supercog);
    setPreviousGoTerm(goTerm);
    setPreviousAspect(aspect);
    setPreviousTaxonomy(taxonomy);
  }, [completedX, completedY, selectedType, lengthRange, pLDDT, supercog, goTerm, aspect, visible, debouncedSendMessage, taxonomy]);

  React.useEffect(() => {
    return () => {
      debouncedSendMessage.cancel();
    };
  }, [debouncedSendMessage]);

  React.useEffect(() => {
    if (lastMessage) {
      if (lastProcessedMessageRef.current === lastMessage.data) {
        return;
      }
      lastProcessedMessageRef.current = lastMessage.data;
      try {
        const data = JSON.parse(lastMessage.data);
        switch (data.type) {
          case 'init':
            setBackgroundData(data.points);
            window.backgroundData = data.points;
            setIsLoading(false);
            break;

          case 'update':
            if (data.is_last) {
              // Last batch - update the streaming data
              setStreamingData(prev => [...prev, ...data.points]);
              setIsLoading(false);
            } else {
              // Accumulate streaming data
              setStreamingData(prev => [...prev, ...data.points]);
            }
            break;

          case 'error':
            console.error('Server error:', data.message);
            setIsLoading(false);
            break;
        }

        // Combine background and streaming data for rendering
        let combinedData;
        if (!goTerm && !aspect)
          combinedData = [...backgroundData, ...streamingData];
        else
          combinedData = streamingData;

        console.log("Combined data:", combinedData.length);

        setCurrentData(combinedData);
        window.currentData = combinedData;

      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, backgroundData]);

  // Clear streaming data when query parameters change
  React.useEffect(() => {
    setStreamingData([]);
  }, [selectedType, lengthRange, pLDDT, supercog, goTerm, aspect, taxonomy]);

  React.useEffect(() => {
    sendMessage(JSON.stringify({ type: 'init' }));
  }, []);
  
  return (
    <CosmographProvider>
      <Cosmograph
      useQuadtree={true}
      style={{ width: "100%", height: "100vh" }} 
      nodes={viewableData} 
      nodeColor={(node) => node["color"]} 
      nodeSize={0.05}
      showDynamicLabels={false}
    />
    </CosmographProvider>
  );
}