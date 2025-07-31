import React from 'react';
import { XyScatterRenderableSeries, XyDataSeries, SweepAnimation, EllipsePointMarker, DataPointSelectionPaletteProvider, GenericAnimation, easing, NumberRangeAnimator, NumberRange, Logger } from "scichart";
import { SciChartReact } from "scichart-react";
import { prepareChart } from '../chartSetup';
import { useDebounce } from '../useDebounce';
import { DataPointSelectionModifier } from "scichart/Charting/ChartModifiers/DataPointSelectionModifier";
import pv from 'bio-pv';
import useWebSocket from 'react-use-websocket';
import { useCallback } from 'react';
import { debounce } from 'lodash';
import { SOURCES, SOURCE_MAPPING, ANNOTATION_MAPPING, TAXONOMY_MAPPING, X_START, SearchMode, DJANGO_HOST } from '../utils/consts';

export default function Chart({ selectedType, selectionCallback, lengthRange, pLDDT, supercog, foundItem, goTerm, aspect, setIsLoading, taxonomy }) {
  const rootElementId = "scichart-root";

  const sciChartSurfaceRef = React.useRef(null);
  const wasmContextRef = React.useRef(null);

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
  const [zoomFactor, setZoomFactor] = React.useState(1);
  const [previousSupercog, setPreviousSupercog] = React.useState([]);
  const [previousFoundItem, setPreviousFoundItem] = React.useState(null);
  const [backgroundData, setBackgroundData] = React.useState([]);
  const [streamingData, setStreamingData] = React.useState([]);
  const [previousGoTerm, setPreviousGoTerm] = React.useState("");
  const [previousAspect, setPreviousAspect] = React.useState("");
  const [previousTaxonomy, setPreviousTaxonomy] = React.useState([]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(`${window.location.protocol === 'https:' ? 'wss' : window.location.protocol === 'http:' ? 'ws' : 'ws'}://${DJANGO_HOST.replace("http://", "").replace("https://", "") || window.location.host}/ws/points`, {
    shouldReconnect: (closeEvent) => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    share: false,
  });

  const initFunction = React.useCallback(prepareChart(), []);

  const zoomCallbackX = React.useCallback((zoomState) => {
    setVisible((prev) => ({
      ...prev,
      x: {
        min: zoomState.visibleRange.min,
        max: zoomState.visibleRange.max
      }
    }));
    setCompletedX(true);
  }, []);

  const zoomCallbackY = React.useCallback((zoomState) => {
    setVisible((prev) => ({
      ...prev,
      y: {
        min: zoomState.visibleRange.min,
        max: zoomState.visibleRange.max
      }
    }));
    setCompletedY(true);
  }, []);

  const debouncedSendMessage = useCallback(
    debounce((message) => {
      sendMessage(message);
      setIsLoading(true);
    }, 100),
    [sendMessage]
  );

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

  // Add this new effect to force a view update when GO term filters change
  React.useEffect(() => {
    if (sciChartSurfaceRef.current && (goTerm !== previousGoTerm || aspect !== previousAspect || taxonomy !== previousTaxonomy)) {
      // Force a view update by slightly adjusting the visible range
      const xAxis = sciChartSurfaceRef.current.xAxes.get(0);
      const yAxis = sciChartSurfaceRef.current.yAxes.get(0);

      if (xAxis && yAxis) {
        // Store current ranges
        const currentXRange = xAxis.visibleRange;
        const currentYRange = yAxis.visibleRange;

        // Trigger a small change to force update
        setTimeout(() => {
          // Apply a tiny offset to force redraw
          const xOffset = (currentXRange.max - currentXRange.min) * 0.001;
          const yOffset = (currentYRange.max - currentYRange.min) * 0.001;

          // Set new ranges with tiny offsets
          xAxis.visibleRange = new NumberRange(
            currentXRange.min - xOffset,
            currentXRange.max + xOffset
          );

          yAxis.visibleRange = new NumberRange(
            currentYRange.min - yOffset,
            currentYRange.max + yOffset
          );

          // This will trigger the zoom callbacks which will request new data
        }, 100);
      }
    }
  }, [goTerm, aspect, previousGoTerm, previousAspect, taxonomy, previousTaxonomy]);

  React.useEffect(() => {
    return () => {
      debouncedSendMessage.cancel();
    };
  }, [debouncedSendMessage]);

  React.useEffect(() => {
    if (lastMessage) {
      setIsLoading(false);
      try {
        const data = JSON.parse(lastMessage.data);
        switch (data.type) {
          case 'init':
            // Set permanent background data
            setBackgroundData(data.points);
            window.backgroundData = data.points;
            break;

          case 'update':
            if (data.is_last) {
              // Last batch - update the streaming data
              setStreamingData(prev => [...prev, ...data.points]);
            } else {
              // Accumulate streaming data
              setStreamingData(prev => [...prev, ...data.points]);
            }
            break;

          case 'error':
            console.error('Server error:', data.message);
            break;
        }

        // Combine background and streaming data for rendering
        let combinedData;
        if (!goTerm && !aspect)
          combinedData = [...backgroundData, ...streamingData];
        else
          combinedData = streamingData;

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

  function onSelectionChanged(data) {
    if (data.selectedDataPoints.length === 0) return;

    // Add error handling for missing metadata
    // Iterate through all selected data points
    for (const selectedPoint of data.selectedDataPoints) {
      console.log(selectedPoint.metadataProperty);
      if (!selectedPoint.metadataProperty) {
        console.warn("Selected point is missing metadata");
        continue;
      }

      if (!selectedPoint.metadataProperty.active) {
        console.warn("Selected point is not active");
        continue;
      }

      const idx = selectedPoint.metadataProperty.name;
      if (!idx) {
        console.warn("Selected point metadata is missing name property");
        continue;
      }

      const matchingData = window.currentData.filter((d) => d.protein === idx);
      if (matchingData.length === 0) {
        console.warn(`No data found with name: ${idx}`);
        continue;
      }

      // Return the first valid match found
      selectionCallback(matchingData[0]);
      return;
    }

    // If we get here, no valid points were found
    console.warn("No valid data points found in selection");
  }

  React.useEffect(() => {
    if (foundItem === previousFoundItem || !foundItem) return;

    // set x, y to the center of the protein
    const x = foundItem.x;
    const y = foundItem.y;

    const xAxisOld = sciChartSurfaceRef.current.xAxes.get(0);
    const yAxisOld = sciChartSurfaceRef.current.yAxes.get(0);

    const animation = new GenericAnimation({
      from: {
        minX: xAxisOld.visibleRange.min,
        maxX: xAxisOld.visibleRange.max,
        minY: yAxisOld.visibleRange.min,
        maxY: yAxisOld.visibleRange.max
      },
      to: {
        minX: x - 0.3,
        maxX: x + 0.3,
        minY: y - 0.3,
        maxY: y + 0.3
      },
      duration: 500,
      ease: easing.inOutSine,
      onAnimate: (from, to, progress) => {
        const xInterpolate = NumberRangeAnimator.interpolate(new NumberRange(from.minX, from.maxX), new NumberRange(to.minX, to.maxX), progress);
        const yInterpolate = NumberRangeAnimator.interpolate(new NumberRange(from.minY, from.maxY), new NumberRange(to.minY, to.maxY), progress);
        xAxisOld.visibleRange = new NumberRange(xInterpolate.min, xInterpolate.max);
        yAxisOld.visibleRange = new NumberRange(yInterpolate.min, yInterpolate.max);
      },
      onCompleted: () => {
        setPreviousFoundItem(foundItem);
        zoomCallbackX({ visibleRange: { min: x - 1, max: x + 1 } });
        zoomCallbackY({ visibleRange: { min: y - 1, max: y + 1 } });
      }
    });

    sciChartSurfaceRef.current.addAnimation(animation);
  }, [foundItem]);

  React.useEffect(() => {
    console.log("init");
    sendMessage(JSON.stringify({ type: 'init' }));

    initFunction(rootElementId).
      then(({ sciChartSurface, wasmContext }) => {
        sciChartSurfaceRef.current = sciChartSurface;
        wasmContextRef.current = wasmContext;
        window.plot = sciChartSurface;
        window.wasmContext = wasmContext;

        const dataPointSelection = new DataPointSelectionModifier();
        dataPointSelection.selectionChanged.subscribe(onSelectionChanged);
        dataPointSelection.allowDragSelect = false;

        sciChartSurface.xAxes.get(0).visibleRangeChanged.subscribe(zoomCallbackX);
        sciChartSurface.yAxes.get(0).visibleRangeChanged.subscribe(zoomCallbackY);
        sciChartSurface.chartModifiers.add(dataPointSelection);
      });
  }, []);

  React.useEffect(() => {
    if (currentData && sciChartSurfaceRef.current) {
      // remove previous series
      sciChartSurfaceRef.current?.renderableSeries.clear();

      const grayedOutData = window.backgroundData;
      const xValuesGrayedOut = grayedOutData.map((d) => d.x);
      const yValuesGrayedOut = grayedOutData.map((d) => d.y);

      sciChartSurfaceRef.current.renderableSeries.add(
        new XyScatterRenderableSeries(wasmContextRef.current, {
          dataSeries: new XyDataSeries(wasmContextRef.current, {
            xValues: xValuesGrayedOut,
            yValues: yValuesGrayedOut,
            // Add metadata to background points as well
            metadata: grayedOutData.map(d => ({ name: d.protein, active: false }))
          }),
          opacity: 0.2,
          animation: new SweepAnimation({ duration: 0, fadeEffect: true }),
          pointMarker: new EllipsePointMarker(wasmContextRef.current, {
            width: Math.min(10 / zoomFactor, 16),
            height: Math.min(10 / zoomFactor, 16),
            fill: 'gray',
            stroke: 'gray'
          }),
        })
      )

      const colors = currentData.map((d) => d.origin);

      const unique_colors = [...new Set(colors)];

      const colorMap = {
        "AFDB dark clusters": "#4C5B5C",
        "AFDB light clusters": "#4aa3ff",
        "ESMAtlas clusters": "#2ca02c",
        "MIP clusters": "#d62728",
        "MIP singletons": "#ff9999"
      }

      // just a tad darker
      const strokeMap = {
        "AFDB dark clusters": "#3f8fcc",
        "AFDB light clusters": "#3f8fcc",
        "ESMAtlas clusters": "#1f7f1f",
        "MIP clusters": "#b71c1c",
        "MIP singletons": "#cc7f7f"
      }

      for (let i = 0; i < unique_colors.length; i++) {
        if (!selectedType.includes(unique_colors[i]))
          continue;
        const color = unique_colors[i];
        let data = currentData.filter((d) => d.origin === color);

        // Deduplicate data by name
        const uniqueNames = new Set();
        data = data.filter(d => {
          if (uniqueNames.has(d.protein)) {
            return false;
          }
          uniqueNames.add(d.protein);
          return true;
        });

        data = data.filter((d) => d.length >= lengthRange[0] && d.length <= lengthRange[1]);
        data = data.filter((d) => (d["afdb_pLDDT"] >= pLDDT[0] && d["afdb_pLDDT"] <= pLDDT[1]) || d["afdb_pLDDT"] === -1);
        data = data.filter((d) => supercog.includes(d["superCOG_v10"]));
        data = data.filter((d) => taxonomy.includes(d["taxonomy"]));
        const xValues = data.map((d) => d.x);
        const yValues = data.map((d) => d.y);

        // Simplify metadata to only include essential properties
        const metadata = data.map((d) => ({
          name: d.protein,
          isSelected: d.protein === foundItem?.protein,
          active: true
        }));

        sciChartSurfaceRef.current.renderableSeries.add(
          new XyScatterRenderableSeries(wasmContextRef.current, {
            dataSeries: new XyDataSeries(wasmContextRef.current, {
              xValues,
              yValues,
              metadata
            }),
            opacity: Math.min(0.6 / zoomFactor, 1),
            animation: new SweepAnimation({ duration: 0, fadeEffect: true }),
            pointMarker: new EllipsePointMarker(wasmContextRef.current, {
              width: Math.min(10 / zoomFactor, 16),
              height: Math.min(10 / zoomFactor, 16),
              // strokeThickness: 3 / zoomFactor,
              fill: colorMap[color],
              // stroke: strokeMap[color]
            }),
            paletteProvider: new DataPointSelectionPaletteProvider({ stroke: 'orange', fill: 'orange' }),
          })
        )
      }
    }
  }, [currentData, selectedType, foundItem]);

  return (<div id={rootElementId} style={{ width: "100%", height: "100vh" }} />);
}