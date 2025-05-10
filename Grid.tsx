import { useContext, useEffect, useState } from "react";
import { boardContext } from "./Board";

// TODO: Find a fix for this optional options stuff. It's a mess right now, the user needs to provide all the options
export type GridOptions = {
  xRange: [number, number];
  yRange: [number, number];
  grid: {
    visible: boolean;
    stroke: string;
    strokeWidth: number;
    gap: number;
  };
  axes: {
    visible: boolean;
    stroke: string;
    strokeWidth: number;
  };
};

type Props = {
  options?: Partial<GridOptions>;
};

export default function Grid({ options }: Props) {
  const {
    grid = { visible: true, stroke: "black", strokeWidth: 1, gap: 1 },
    axes = { visible: true, stroke: "red", strokeWidth: 2 },
    xRange = [-10, 10],
    yRange = [-10, 10],
  } = options ?? {};

  // The coordinates for the grid lines need to be in world coordinates
  // because the board can be zoomed and panned. We'll only convert them
  // to screen coordinates during drawing.
  const { svg, screenToWorld, worldToScreen } = useContext(boardContext);

  // Temporary fixed bounds. When features like panning are added,
  // the grid lines need to be generated dynamically based on the viewport
  // These are in world coordinates
  // TODO: Make these dynamic based on the SVG viewport
  const xBounds = xRange;
  const yBounds = yRange;

  const [xLines, setXLines] = useState<
    { x1: number; y1: number; x2: number; y2: number }[]
  >([]);
  const [yLines, setYLines] = useState<
    { x1: number; y1: number; x2: number; y2: number }[]
  >([]);

  const [xAxis, setXAxis] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>();
  const [yAxis, setYAxis] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>();

  useEffect(() => {
    // Generate all "ticks" for the axes
    const xCoords = [];
    const yCoords = [];
    // I know the coordinate 0 will be added twice here, but it's not a big deal
    for (let x = 0; x <= xBounds[1]; x += grid.gap) xCoords.push(x);
    for (let x = 0; x >= xBounds[0]; x -= grid.gap) xCoords.push(x);
    for (let y = 0; y <= yBounds[1]; y += grid.gap) yCoords.push(y);
    for (let y = 0; y >= yBounds[0]; y -= grid.gap) yCoords.push(y);

    const xLines = xCoords.map((x) => {
      const p1 = worldToScreen(yBounds[0], x);
      const p2 = worldToScreen(yBounds[1], x);
      return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    });
    const yLines = yCoords.map((y) => {
      const p1 = worldToScreen(y, xBounds[0]);
      const p2 = worldToScreen(y, xBounds[1]);
      return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    });
    setXLines(xLines);
    setYLines(yLines);

    {
      const p1 = worldToScreen(0, xBounds[0]);
      const p2 = worldToScreen(0, xBounds[1]);
      setXAxis({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    }
    {
      const p1 = worldToScreen(yBounds[0], 0);
      const p2 = worldToScreen(yBounds[1], 0);
      setYAxis({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    }
  }, [grid.gap, screenToWorld, worldToScreen]);

  return (
    <g>
      {grid.visible &&
        xLines.map((line, i) => (
          <line
            key={i}
            {...line}
            stroke={grid.stroke}
            strokeWidth={grid.strokeWidth}
          />
        ))}
      {grid.visible &&
        yLines.map((line, i) => (
          <line
            key={i}
            {...line}
            stroke={grid.stroke}
            strokeWidth={grid.strokeWidth}
          />
        ))}
      {axes.visible && xAxis && (
        <line {...xAxis} stroke={axes.stroke} strokeWidth={axes.strokeWidth} />
      )}
      {axes.visible && yAxis && (
        <line {...yAxis} stroke={axes.stroke} strokeWidth={axes.strokeWidth} />
      )}
    </g>
  );
}
