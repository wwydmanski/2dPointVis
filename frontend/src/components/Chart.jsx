import React, { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import { debounce } from 'lodash';
import { DJANGO_HOST } from '../utils/consts';
import { Graph } from '@cosmos.gl/graph';
import { colorMap } from '../utils/consts';
import hexToRgba from '../utils/hexToRgba';
import graphConfig from '../utils/graphConfig';

export default function Chart({ selectedType, selectionCallback, lengthRange, pLDDT, supercog, foundItem, goTerm, aspect, setIsLoading, taxonomy, zoomedItem }) {
  // Main state
  const [currentData, setCurrentData] = useState(undefined);
  const [visible, setVisible] = useState({
    x: { min: -20, max: 20 },
    y: { min: -30, max: 20 }
  });
  
  // Data fetching state
  const [backgroundData, setBackgroundData] = useState([]);
  const [streamingData, setStreamingData] = useState([]);
  
  // Tracking state for preventing unnecessary re-fetching
  const [viewportChanged, setViewportChanged] = useState(false);
  const [previousFilters, setPreviousFilters] = useState({
    selectedType: [],
    lengthRange: [0, 2700],
    pLDDT: [20, 100],
    supercog: [],
    goTerm: "",
    aspect: "",
    taxonomy: []
  });

  // Refs
  const graphRef = useRef();
  const graphInstanceRef = useRef(null);
  const lastProcessedMessageRef = useRef(null);
  const prevCurrentDataRef = useRef();

  const host = typeof DJANGO_HOST === "string" && DJANGO_HOST.length > 0
  ? DJANGO_HOST.replace("http://", "").replace("https://", "")
  : window.location.host;

  const { sendMessage, lastMessage } = useWebSocket(
    `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${host}/api/ws/points`,
    {
      shouldReconnect: (closeEvent) => true,
      reconnectInterval: 3000,
      reconnectAttempts: 10,
      share: false,
    }
  );

  const handleNodeClick = (index, data) => {
    if (!graphInstanceRef.current) return;
    graphInstanceRef.current.unselectPoints();
    const nextSizes = currentData.map((_) => 3);
    if (index !== undefined && data) {
      const node = data[index];
      graphInstanceRef.current.selectPointByIndex(index);
      selectionCallback(node);
      nextSizes[index] = 9;
    }
    if(index === undefined) {
      selectionCallback(null);
    }
    graphInstanceRef.current.setPointSizes(nextSizes);
    graphInstanceRef.current.render();
  };

  const zoomCallback = useCallback((zoomEvent) => {
    if (!graphInstanceRef.current) return;

    const canvasWidth = graphInstanceRef.current.canvas.width;
    const canvasHeight = graphInstanceRef.current.canvas.height;

    const [left, top] = graphInstanceRef.current.screenToSpacePosition([0, 0]);
    const [right, bottom] = graphInstanceRef.current.screenToSpacePosition([canvasWidth, canvasHeight]);

    setVisible({
      x: { min: left, max: right },
      y: { min: bottom, max: top }
    });

    setViewportChanged(true);
  }, []);

  // Initialize graph instance
  useEffect(() => {
    if (!graphInstanceRef.current && graphRef.current) {
      graphInstanceRef.current = new Graph(graphRef.current, graphConfig(zoomCallback));
    }
    
    return () => {
      if (graphInstanceRef.current) {
        graphInstanceRef.current.destroy();
        graphInstanceRef.current = null;
      }
    };
  }, []);
  
  // Handle data visualization updates
  const [pendingZoomIndex, setPendingZoomIndex] = useState(null);
  const [hasInitialZoomed, setHasInitialZoomed] = useState(false);

  const showPoint = (point, lengthRange, pLDDT, supercog, taxonomy) => {
    return point.length >= lengthRange[0] && point.length <= lengthRange[1] &&
      ((point.afdb_pLDDT >= pLDDT[0] && point.afdb_pLDDT <= pLDDT[1]) || point.afdb_pLDDT === -1) &&
      supercog.includes(point.superCOG_v10) &&
      taxonomy.includes(point.taxonomy) &&
      selectedType.includes(point.origin)
  }

  useEffect(() => {
    if (!graphInstanceRef.current || !currentData) return;

    const pointPositions = currentData.map(d => [d.x, d.y]).flat();
    const pointColors = currentData.map(element => {
      if(showPoint(element, lengthRange, pLDDT, supercog, taxonomy)) {
        return hexToRgba(element.color || colorMap[element.origin] || "#888888")
      }
      return hexToRgba(colorMap["filtered out"])
    }).flat();

    graphInstanceRef.current.setPointPositions(pointPositions);
    graphInstanceRef.current.setPointColors(pointColors);
    graphInstanceRef.current.config.onClick = (index => handleNodeClick(index, currentData));

    // Only zoom out on very first dataset render
    if (!hasInitialZoomed && currentData.length > 0) {
      setHasInitialZoomed(true);
    }

    graphInstanceRef.current.render();
    prevCurrentDataRef.current = currentData;

    // Zoom to pending index if set
    if (pendingZoomIndex !== null && currentData[pendingZoomIndex]) {
      graphInstanceRef.current.zoomToPointByIndex(pendingZoomIndex, 700, 100);
      graphInstanceRef.current.selectPointByIndex(pendingZoomIndex);
      setPendingZoomIndex(null);
    }

  }, [currentData, lengthRange, pLDDT, supercog, taxonomy]);

  // Debounced server request function
  const debouncedSendMessage = useCallback(
    debounce((message) => {
      sendMessage(message);
      setIsLoading(true);
    }, 400),
    [sendMessage, setIsLoading]
  );

  // Request data when viewport or filters change
  useEffect(() => {
    const filtersChanged = 
      selectedType !== previousFilters.selectedType || 
      lengthRange[0] !== previousFilters.lengthRange[0] || 
      lengthRange[1] !== previousFilters.lengthRange[1] || 
      pLDDT[0] !== previousFilters.pLDDT[0] || 
      pLDDT[1] !== previousFilters.pLDDT[1] || 
      supercog !== previousFilters.supercog ||
      goTerm !== previousFilters.goTerm ||
      aspect !== previousFilters.aspect ||
      taxonomy !== previousFilters.taxonomy;
    
    if (!viewportChanged && !filtersChanged) return;
    
    const message = {
      x0: visible.x.min,
      x1: visible.x.max,
      y0: visible.y.min,
      y1: visible.y.max,
      types: selectedType,
      lengthRange,
      pLDDT,
      supercog,
      goTerm,
      ontology: aspect,
      taxonomy
    };

    debouncedSendMessage(JSON.stringify(message));
    setViewportChanged(false);
    setPreviousFilters({
      selectedType,
      lengthRange,
      pLDDT,
      supercog,
      goTerm,
      aspect,
      taxonomy
    });
  }, [
    visible, selectedType, lengthRange, pLDDT, supercog, goTerm, aspect, taxonomy,
    viewportChanged, previousFilters, debouncedSendMessage
  ]);

  useEffect(() => {
    if(foundItem && graphInstanceRef.current && currentData) {
      graphInstanceRef.current.unselectPoints();
      const nextSizes = currentData.map((_) => 3);
      selectionCallback(foundItem);
      currentData.forEach((item, index) => {
        if (item["clean_name"] === foundItem["clean_name"]) {
          graphInstanceRef.current.selectPointByIndex(index);
          nextSizes[index] = 9;
        }
      });
      graphInstanceRef.current.setPointSizes(nextSizes);
      graphInstanceRef.current.render();
    }
  },[foundItem])

  useEffect(() => {
    if(goTerm && graphInstanceRef.current && currentData) {
      graphInstanceRef.current.unselectPoints();
    }
  }, [goTerm]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSendMessage.cancel();
    };
  }, [debouncedSendMessage]);

  // Process WebSocket messages
  useEffect(() => {
    if (!lastMessage || lastProcessedMessageRef.current === lastMessage.data) return;
    
    lastProcessedMessageRef.current = lastMessage.data;
    try {
      const data = JSON.parse(lastMessage.data);
      let tempNewStreamingData = [];
      
      switch (data.type) {
        case 'init':
          setBackgroundData(data.points);
          break;

        case 'update':
          if(data.is_last) {
            setIsLoading(false);
          }
          tempNewStreamingData = [...data.points, ...streamingData]
          setStreamingData(prev => [...data.points, ...prev]);
          break;

        case 'error':
          console.error('Server error:', data.message);
          setIsLoading(false);
          break;
      }

      // Combine data based on whether we're filtering by GO terms
      const combinedData = (!goTerm && !aspect) 
        ? [...backgroundData, ...tempNewStreamingData]
        : tempNewStreamingData;

      if(foundItem && graphInstanceRef.current && (graphInstanceRef.current.getSelectedIndices()?.length ?? 0) > 0 && backgroundData && tempNewStreamingData) {
        combinedData.push(foundItem)
        const index = combinedData.length - 1
        const nextSizes = combinedData.map((_) => 3);
        graphInstanceRef.current.selectPointByIndex(index);
        nextSizes[index] = 9;
        graphInstanceRef.current.setPointSizes(nextSizes);
        graphInstanceRef.current.render();
      }
      setCurrentData(combinedData.map(element => ({ ...element, id: element.clean_name })));
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [lastMessage]);

  // Reset streaming data when filters change
  useEffect(() => {
    setStreamingData([]);
  }, [goTerm, aspect, viewportChanged, goTerm, aspect, setIsLoading]);

  // Initial data fetch
  useEffect(() => {
    sendMessage(JSON.stringify({ type: 'init' }));
  }, [sendMessage]);

  useEffect(() => {
    if(zoomedItem && graphInstanceRef.current && currentData) {
      let found = false;
      currentData.forEach((item, index) => {
        if (item["clean_name"] === zoomedItem["clean_name"]) {
          graphInstanceRef.current.zoomToPointByIndex(index, 700, 100);
          graphInstanceRef.current.selectPointByIndex(index);
          found = true;
        }
      });
      if (!found) {
        setCurrentData(prev => {
          const updatedData = [...prev];
          updatedData.push(zoomedItem);
          setPendingZoomIndex(updatedData.length - 1);
          return updatedData;
        });
      }
    }
  }, [zoomedItem]);

  return (
    <div id="chart" style={{ width: "100%", height: "100vh", position: "absolute", top: 0, left: 0, overflow: "hidden" }} ref={graphRef} />
  );
}