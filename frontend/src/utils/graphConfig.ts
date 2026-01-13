const graphConfig = (zoomCallback: (zoomEvent: any) => void, simulationStartCallback: () => void) => ({
    pointGreyoutOpacity: 0.4,
    enableSimulation: false,
    spaceSize: 4096,
    backgroundColor: '#2d313a',
    linkWidth: 0.6,
    scalePointsOnZoom: false,
    linkArrows: false,
    linkGreyoutOpacity: 0,
    curvedLinks: true,
    renderHoveredPointRing: true,
    hoveredPointRingColor: '#4B5BBF',
    pointSize: 3,
    pixelRatio: 1,
    rescalePositions: 0,
    onZoom: zoomCallback,
    onSimulationStart: simulationStartCallback
})

export default graphConfig;