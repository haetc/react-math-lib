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

  // Pan is in screen (SVG) coordinates
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // const [zoom, setZoom] = useState(1);

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

      const screenX = clientWidth / 2 + x * gap + pan.x;
      const screenY = clientHeight / 2 - y * gap + pan.y;

      return { x: screenX, y: screenY };
    },
    [finalOptions.unit, pan]
  );
  const screenToWorld = useCallback(
    (x: number, y: number) => {
      if (!svgRef.current) {
        return { x, y };
      }
      const gap = finalOptions.unit;
      const { clientWidth, clientHeight } = svgRef.current;

      const worldX = (x - clientWidth / 2 - pan.x) / gap;
      const worldY = (clientHeight / 2 - y - pan.y) / gap;

      return { x: worldX, y: worldY };
    },
    [finalOptions.unit, pan]
  );
  const worldToScreenLength = useCallback(
    (length: number) => length * finalOptions.unit,
    [finalOptions.unit]
  );
  const screenToWorldLength = useCallback(
    (length: number) => length / finalOptions.unit,
    [finalOptions.unit]
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
      setPan(({ x, y }) => ({
        x: x + event.movementX,
        y: y + event.movementY,
      }));
    },
    [isPanning]
  );

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
        ref={svgRef}
        {...props}
      >
        {children}
      </svg>
    </boardContext.Provider>
  );
}
