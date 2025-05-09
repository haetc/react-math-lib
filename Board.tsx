import { createContext, useCallback, useRef, useState } from "react";

// TODO: Maybe create two disctinct types for WorldCoords and ScreenCoords
type BoardContextType = {
  svg: SVGSVGElement | null;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  screenToWorld: (x: number, y: number) => { x: number; y: number };
  worldToScreenLength: (length: number) => number;
  screenToWorldLength: (length: number) => number;
};

export const boardContext = createContext<BoardContextType>({
  svg: null,
  worldToScreen: (x, y) => ({ x, y }),
  screenToWorld: (x, y) => ({ x, y }),
  worldToScreenLength: (length) => length,
  screenToWorldLength: (length) => length,
});

type BoardOptions = {
  unit: number;
};

const defaultBoardOptions: BoardOptions = {
  unit: 10,
};

type Props = {
  children: React.ReactNode;
  options?: Partial<BoardOptions>;
} & React.SVGProps<SVGSVGElement>;

export default function Board({ children, options, ...props }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan is in world coordinates
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Zoom is basically a multiplier for the unit
  const [zoom, setZoom] = useState(1);

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

  // Panning event
  const [isPanning, setIsPanning] = useState(false);
  const handleMouseDown = () => {
    setIsPanning(true);
  };
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!isPanning) return;

      // Transform the movement vector to world coordinates
      const movementX = screenToWorldLength(event.movementX);
      const movementY = -screenToWorldLength(event.movementY);

      setPan(({ x, y }) => ({
        x: x + movementX,
        y: y + movementY,
      }));
    },
    [isPanning]
  );

  // Zooming event
  // const handleWheel = useCallback(
  // (event: React.WheelEvent<SVGSVGElement>) => {
  //   const rect = svgRef.current?.getBoundingClientRect();
  //   if (!rect) return;

  //   // Get pointer position before the zoom
  //   const eventScreen = {
  //     x: event.clientX - rect.left,
  //     y: event.clientY - rect.top,
  //   };
  //   const originScreen = {
  //     x: rect.width / 2,
  //     y: rect.height / 2,
  //   };
  //   const panAmount = {
  //     x: eventScreen.x - originScreen.x,
  //     y: eventScreen.y - originScreen.y,
  //   };

  //   // Apply zoom
  //   const zoomStep = -event.deltaY / 1000;
  //   const newZoom = zoom + zoomStep;
  //   setZoom(Math.max(0.1, Math.min(10, newZoom)));

  //   // Find pointer position after the zoom

  //   setPan(worldToScreen(pan.x + panAmount.x, pan.y + panAmount.y));
  // },
  // [screenToWorld, worldToScreen]
  // );

  return (
    <boardContext.Provider
      value={{
        svg: svgRef.current,
        worldToScreen,
        screenToWorld,
        worldToScreenLength,
        screenToWorldLength,
      }}
    >
      <svg
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        // onWheel={handleWheel}
        ref={svgRef}
        {...props}
      >
        {children}
      </svg>
    </boardContext.Provider>
  );
}
