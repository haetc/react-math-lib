import { useContext, useEffect, useState } from "react";
import { boardContext } from "./Board";

type GridOptions = {
  stroke: string;
  strokeWidth: number;
  gap: number;
  axes: {
    visible: boolean;
    stroke: string;
    strokeWidth: number;
  };
};

const defaultGridOptions: GridOptions = {
  stroke: "black",
  strokeWidth: 1,
  gap: 1,
  axes: {
    visible: true,
    stroke: "red",
    strokeWidth: 2,
  },
};

type Props = {
  options?: Partial<GridOptions>;
};

export default function Grid({ options }: Props) {
  const finalOptions = {
    ...defaultGridOptions,
    ...options,
  };

  const { stroke, strokeWidth, axes } = finalOptions;

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
  const gap = finalOptions.gap;

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
    for (let x = 0; x <= xBounds[1]; x += gap) xCoords.push(x);
    for (let x = 0; x >= xBounds[0]; x -= gap) xCoords.push(x);
    for (let y = 0; y <= yBounds[1]; y += gap) yCoords.push(y);
    for (let y = 0; y >= yBounds[0]; y -= gap) yCoords.push(y);

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
  }, [gap, screenToWorld, worldToScreen]);

  return (
    <g>
      {xLines.map((line, i) => {
        const isXAxis = screenToWorld(line.x1, line.y1).y === 0;
        return (
          <line
            key={i}
            {...line}
            stroke={isXAxis && axes.visible ? axes.stroke : stroke}
            strokeWidth={
              isXAxis && axes.visible ? axes.strokeWidth : strokeWidth
            }
          />
        );
      })}
      {yLines.map((line, i) => {
        const isYAxis = screenToWorld(line.x1, line.y1).x === 0;
        return (
          <line
            key={i}
            {...line}
            stroke={isYAxis && axes.visible ? axes.stroke : stroke}
            strokeWidth={
              isYAxis && axes.visible ? axes.strokeWidth : strokeWidth
            }
          />
        );
      })}
    </g>
  );
}
