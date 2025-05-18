import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  Children,
  isValidElement,
} from "react";

import Overlay from "./Overlay";

// TODO: Maybe create two disctinct types for WorldCoords and ScreenCoords
// TODO: Also add some helper functions to get the edges of the viewport in screen and world coords
// useful for infinite grid, and adaptive function plotting
type BoardContextType = {
  svg: SVGSVGElement | null;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  screenToWorld: (x: number, y: number) => { x: number; y: number };
  worldToScreenLength: (length: number) => number;
  screenToWorldLength: (length: number) => number;
  isDraggingSomething: boolean;
  setIsDraggingSomething: (isDraggingSomething: boolean) => void;
};

export const boardContext = createContext<BoardContextType>({
  svg: null,
  worldToScreen: (x, y) => ({ x, y }),
  screenToWorld: (x, y) => ({ x, y }),
  worldToScreenLength: (length) => length,
  screenToWorldLength: (length) => length,
  isDraggingSomething: false,
  setIsDraggingSomething: () => {},
});

export type BoardOptions = {
  unit: number;
  zoom: {
    enabled: boolean;
  };
  pan: {
    enabled: boolean;
  };
};

const defaultBoardOptions: BoardOptions = {
  unit: 10,
  zoom: {
    enabled: true,
  },
  pan: {
    enabled: true,
  },
};

type Props = {
  children: React.ReactNode;
  options?: Partial<BoardOptions>;
  zoomLevel?: number;
  panVector?: { x: number; y: number };
  svgProps?: React.SVGProps<SVGSVGElement>;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Board({
  children,
  options,
  zoomLevel,
  panVector,
  svgProps,
  ...props
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan is in world coordinates
  const [pan, setPan] = useState(panVector ?? { x: 0, y: 0 });
  // Zoom is basically a multiplier for the unit
  const [zoom, setZoom] = useState(zoomLevel ?? 1);

  // This is used to disable pointer events on the overlay when a drag has started on the board
  const [isDraggingSomething, setIsDraggingSomething] = useState(false);

  // Update zoom and pan if props change
  useEffect(() => {
    setZoom(zoomLevel ?? 1);
  }, [zoomLevel]);

  useEffect(() => {
    setPan(panVector ?? { x: 0, y: 0 });
  }, [panVector?.x, panVector?.y]);

  const finalOptions = {
    ...defaultBoardOptions,
    ...options,
  };

  // Transformation functions
  // TODO: Create another function to transform vectors (not positions), basically dividing their lengths by the scale and flipping the directions
  const worldToScreen = useCallback(
    (x: number, y: number) => {
      if (!svgRef.current) return { x, y };

      // World coordinates:
      // Origin: Center
      // Right, Up: Positive

      // Screen (SVG) coordinates:
      // Origin: Top Left
      // Right, Down: Positive

      // Gap is how many SVG pixels is a single world unit
      const gap = finalOptions.unit;
      const { clientWidth, clientHeight } = svgRef.current;

      const screenX = clientWidth / 2 + (x + pan.x) * gap * zoom;
      const screenY = clientHeight / 2 - (y + pan.y) * gap * zoom;

      return { x: screenX, y: screenY };
    },
    [finalOptions.unit, pan, zoom]
  );
  const screenToWorld = useCallback(
    (x: number, y: number) => {
      if (!svgRef.current) {
        return { x, y };
      }
      const gap = finalOptions.unit;
      const { clientWidth, clientHeight } = svgRef.current;

      const worldX = (x - clientWidth / 2) / (gap * zoom) - pan.x;
      const worldY = (clientHeight / 2 - y) / (gap * zoom) - pan.y;

      return { x: worldX, y: worldY };
    },
    [finalOptions.unit, pan, zoom]
  );
  const worldToScreenLength = useCallback(
    (length: number) => length * finalOptions.unit * zoom,
    [finalOptions.unit, zoom]
  );
  const screenToWorldLength = useCallback(
    (length: number) => length / (finalOptions.unit * zoom),
    [finalOptions.unit, zoom]
  );

  // Helper functions for touch gestures
  const getDistance = (t1: React.Touch, t2: React.Touch): number => {
    return Math.sqrt(
      Math.pow(t1.clientX - t2.clientX, 2) +
        Math.pow(t1.clientY - t2.clientY, 2)
    );
  };

  const getScreenMidpoint = (
    t1: React.Touch,
    t2: React.Touch
  ): { x: number; y: number } => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  // Panning event
  const [isPanning, setIsPanning] = useState(false);
  const handleMouseDown = () => {
    if (!finalOptions.pan.enabled) return;
    setIsPanning(true);
    setIsDraggingSomething(true);
  };
  const handleMouseUp = () => {
    if (!finalOptions.pan.enabled) return;
    setIsPanning(false);
    setIsDraggingSomething(false);
  };
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!finalOptions.pan.enabled || !isPanning) return;

      // Transform the movement vector to world coordinates
      const movementX = screenToWorldLength(event.movementX);
      const movementY = -screenToWorldLength(event.movementY);

      setPan(({ x, y }) => ({
        x: x + movementX,
        y: y + movementY,
      }));
    },
    [isPanning, finalOptions.pan.enabled, screenToWorldLength, setPan]
  );

  // Touch panning
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStateRef = useRef<{
    initialDistance: number;
    zoomAtPinchStart: number;
    worldMidpointAtPinchStart: { x: number; y: number };
  } | null>(null);

  const handleTouchStart = (event: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    event.preventDefault(); // General prevention for board interactions

    if (event.touches.length === 1 && finalOptions.pan.enabled) {
      pinchStateRef.current = null; // Ensure not in pinch mode
      setIsPanning(true);
      setIsDraggingSomething(true);
      lastTouchRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    } else if (event.touches.length === 2 && finalOptions.zoom.enabled) {
      setIsPanning(false); // Stop panning if it was active
      setIsDraggingSomething(true);
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      const initialDistance = getDistance(touch1, touch2);
      const screenMidpointRaw = getScreenMidpoint(touch1, touch2);

      const rect = svgRef.current.getBoundingClientRect();
      // Adjust screenMidpoint to be relative to the SVG element
      const adjustedScreenMidpoint = {
        x: screenMidpointRaw.x - rect.left,
        y: screenMidpointRaw.y - rect.top,
      };
      const worldMidpoint = screenToWorld(
        adjustedScreenMidpoint.x,
        adjustedScreenMidpoint.y
      );

      pinchStateRef.current = {
        initialDistance,
        zoomAtPinchStart: zoom,
        worldMidpointAtPinchStart: worldMidpoint,
      };
    }
  };

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      event.preventDefault();

      // Panning with one finger
      // TODO: Add an option to enable or disable single finger panning
      // because it might interfere with user scrolling through the page
      if (
        event.touches.length === 1 &&
        isPanning &&
        lastTouchRef.current &&
        finalOptions.pan.enabled
      ) {
        const touch = event.touches[0];
        const movementX = screenToWorldLength(
          touch.clientX - lastTouchRef.current.x
        );
        const movementY = -screenToWorldLength(
          touch.clientY - lastTouchRef.current.y
        );

        setPan(({ x, y }) => ({
          x: x + movementX,
          y: y + movementY,
        }));

        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      }
      // Pinch zooming and panning with two fingers
      else if (
        event.touches.length === 2 &&
        pinchStateRef.current &&
        finalOptions.zoom.enabled
      ) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();

        const currentDistance = getDistance(touch1, touch2);
        const currentScreenMidpointRaw = getScreenMidpoint(touch1, touch2);
        const currentScreenMidpoint = {
          x: currentScreenMidpointRaw.x - rect.left,
          y: currentScreenMidpointRaw.y - rect.top,
        };

        const { initialDistance, zoomAtPinchStart, worldMidpointAtPinchStart } =
          pinchStateRef.current;

        if (initialDistance === 0) return;

        // Calculate new zoom level
        let scaleFactor = currentDistance / initialDistance;
        let newZoomLevel = zoomAtPinchStart * scaleFactor;
        newZoomLevel = Math.max(0.1, Math.min(10, newZoomLevel)); // Clamp zoom
        setZoom(newZoomLevel);

        // Calculate new pan to keep worldMidpointAtPinchStart under currentScreenMidpoint
        const { clientWidth, clientHeight } = svgRef.current;
        const gap = finalOptions.unit;

        // Target pan.x such that:
        // worldMidpointAtPinchStart.x = (currentScreenMidpoint.x - clientWidth / 2) / (gap * newZoomLevel) - newPanX
        const newPanX =
          (currentScreenMidpoint.x - clientWidth / 2) / (gap * newZoomLevel) -
          worldMidpointAtPinchStart.x;

        // Target pan.y such that:
        // worldMidpointAtPinchStart.y = (clientHeight / 2 - currentScreenMidpoint.y) / (gap * newZoomLevel) - newPanY
        const newPanY =
          (clientHeight / 2 - currentScreenMidpoint.y) / (gap * newZoomLevel) -
          worldMidpointAtPinchStart.y;

        setPan({ x: newPanX, y: newPanY });
      }
    },
    [
      isPanning,
      finalOptions.pan.enabled,
      finalOptions.zoom.enabled,
      screenToWorldLength,
      setPan,
      finalOptions.unit,
      // pan and zoom state are not direct dependencies for the 2-finger calculation logic itself,
      // as it uses values from pinchStateRef (based on initial pan/zoom) and calculates new absolute pan/zoom.
      // screenToWorld is used by handleTouchStart which sets up pinchStateRef.
      setZoom,
    ]
  );

  const handleTouchEnd = (event: React.TouchEvent<SVGSVGElement>) => {
    event.preventDefault();

    if (pinchStateRef.current && event.touches.length < 2) {
      // Pinch ended or one finger lifted from a pinch
      pinchStateRef.current = null;
    }

    if (event.touches.length === 0) {
      // All fingers lifted
      setIsPanning(false);
      setIsDraggingSomething(false);
      lastTouchRef.current = null;
    } else if (event.touches.length === 1 && finalOptions.pan.enabled) {
      // One finger remains (could be after a pinch, or a single touch continuing)
      // Transition to panning with this finger
      setIsPanning(true);
      setIsDraggingSomething(true);
      pinchStateRef.current = null; // Ensure not in pinch mode
      lastTouchRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  };

  // Zooming event
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || !svgRef.current || !finalOptions.zoom.enabled) return;

      // Prevent page scrolling
      event.stopPropagation();
      event.preventDefault();

      const eventScreenCoords = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      // World coordinates of the pointer before the zoom.
      const pointerBeforeZoom = screenToWorld(
        eventScreenCoords.x,
        eventScreenCoords.y
      );

      // Use zoom as a multiplier instead of difference
      const zoomStep = 1 - event.deltaY / 1000;
      let newZoomLevel = zoom * zoomStep;
      newZoomLevel = Math.max(0.1, Math.min(10, newZoomLevel));
      setZoom(newZoomLevel);

      // Since react state updates are asynchronous, we need to manually calculate
      // the new pointer position after the zoom, we can't use screenToWorld function
      // This is basically an inlined version of the function here:
      const { clientWidth, clientHeight } = svgRef.current;
      const gap = finalOptions.unit;
      const worldX_afterZoom =
        (eventScreenCoords.x - clientWidth / 2) / (gap * newZoomLevel) - pan.x;
      const worldY_afterZoom =
        (clientHeight / 2 - eventScreenCoords.y) / (gap * newZoomLevel) - pan.y;
      const pointerAfterZoom = {
        x: worldX_afterZoom,
        y: worldY_afterZoom,
      };

      const diff = {
        x: pointerAfterZoom.x - pointerBeforeZoom.x,
        y: pointerAfterZoom.y - pointerBeforeZoom.y,
      };

      setPan((currentPan) => ({
        x: currentPan.x + diff.x,
        y: currentPan.y + diff.y,
      }));
    },
    [screenToWorld, zoom, pan, finalOptions.unit, setZoom, setPan]
  );

  // We need this event to be added manually because React's wheel events are passive,
  // meaning we can't call preventDefault to prevent the page from scrolling.
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const wheelListener = (event: WheelEvent) => handleWheel(event);
    svgElement.addEventListener("wheel", wheelListener, { passive: false });

    return () => svgElement.removeEventListener("wheel", wheelListener);
  }, [handleWheel]);

  // Split children into SVG and overlay
  const allChildren = Children.toArray(children);
  const overlayEls = allChildren.filter(
    (child) => isValidElement(child) && child.type === Overlay
  );
  if (overlayEls.length > 1) {
    throw new Error("Board only accepts one <Overlay> child");
  }
  const overlayChildren = overlayEls;
  const svgChildren =
    overlayEls.length === 1
      ? allChildren.filter((child) => child !== overlayEls[0])
      : allChildren;

  return (
    <boardContext.Provider
      value={{
        svg: svgRef.current,
        worldToScreen,
        screenToWorld,
        worldToScreenLength,
        screenToWorldLength,
        isDraggingSomething,
        setIsDraggingSomething,
      }}
    >
      <div {...props} style={{ position: "relative" }}>
        <svg
          ref={svgRef}
          {...svgProps}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "none", width: "100%", height: "100%" }}
        >
          {svgChildren}
        </svg>
        {overlayChildren}
      </div>
    </boardContext.Provider>
  );
}
