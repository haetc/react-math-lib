import { useContext, useEffect, useState } from "react";
import { boardContext } from "./Board";

// TODO: Find a fix for this optional options stuff. It's a mess right now, the user needs to provide all the options
type GridOptions = {
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
  } = options ?? {};

  // The coordinates for the grid lines need to be in world coordinates
  // because the board can be zoomed and panned. We'll only convert them
  // to screen coordinates during drawing.
  const { svg, screenToWorld, worldToScreen } = useContext(boardContext);

  // Temporary fixed bounds. When features like panning are added,
  // the grid lines need to be generated dynamically based on the viewport
  // These are in world coordinates
  // TODO: Make these dynamic based on the SVG viewport
  const xBounds = [-10, 10];
  const yBounds = [-10, 10];

  const [xLines, setXLines] = useState<
    { x1: number; y1: number; x2: number; y2: number }[]
  >([]);
  const [yLines, setYLines] = useState<
    { x1: number; y1: number; x2: number; y2: number }[]
  >([]);

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
  }, [grid.gap, screenToWorld, worldToScreen]);

  return (
    <g>
      {xLines.map((line, i) => {
        const isXAxis = screenToWorld(line.x1, line.y1).y === 0;
        if (isXAxis && axes.visible) {
          return (
            <line
              key={i}
              {...line}
              stroke={axes.stroke}
              strokeWidth={axes.strokeWidth}
            />
          );
        }

        if (grid.visible) {
          return (
            <line
              key={i}
              {...line}
              stroke={grid.stroke}
              strokeWidth={grid.strokeWidth}
            />
          );
        }
      })}
      {yLines.map((line, i) => {
        const isYAxis = screenToWorld(line.x1, line.y1).x === 0;
        if (isYAxis && axes.visible) {
          return (
            <line
              key={i}
              {...line}
              stroke={axes.stroke}
              strokeWidth={axes.strokeWidth}
            />
          );
        }

        if (grid.visible) {
          return (
            <line
              key={i}
              {...line}
              stroke={grid.stroke}
              strokeWidth={grid.strokeWidth}
            />
          );
        }
      })}
    </g>
  );
}
