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

  // const [pan, setPan] = useState({ x: 0, y: 0 });
  // const [zoom, setZoom] = useState(1);

  const finalOptions = {
    ...defaultBoardOptions,
    ...options,
  };

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

      const screenX = clientWidth / 2 + x * gap;
      const screenY = clientHeight / 2 - y * gap;

      return { x: screenX, y: screenY };
    },
    [finalOptions.unit]
  );

  const screenToWorld = useCallback(
    (x: number, y: number) => {
      if (!svgRef.current) {
        return { x, y };
      }
      const gap = finalOptions.unit;
      const { clientWidth, clientHeight } = svgRef.current;

      const worldX = (x - clientWidth / 2) / gap;
      const worldY = (clientHeight / 2 - y) / gap;

      return { x: worldX, y: worldY };
    },
    [finalOptions.unit]
  );

  const worldToScreenLength = useCallback(
    (length: number) => length * finalOptions.unit,
    [finalOptions.unit]
  );

  const screenToWorldLength = useCallback(
    (length: number) => length / finalOptions.unit,
    [finalOptions.unit]
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
      <svg ref={svgRef} {...props}>
        {children}
      </svg>
    </boardContext.Provider>
  );
}
