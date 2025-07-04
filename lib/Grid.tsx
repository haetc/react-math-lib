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
} & React.SVGProps<SVGLineElement>;

export default function Grid({ options, ...props }: Props) {
  const {
    grid = { visible: true, stroke: "black", strokeWidth: 1, gap: 1 },
    axes = { visible: true, stroke: "black", strokeWidth: 2 },
    xRange,
    yRange,
  } = options ?? {};

  // The coordinates for the grid lines need to be in world coordinates
  // because the board can be zoomed and panned. We'll only convert them
  // to screen coordinates during drawing.
  const { svg, screenToWorld, worldToScreen } = useContext(boardContext);

  // Calculate the edges of the viewport in world coordinates
  const xLeft = screenToWorld(0, 0).x;
  const xRight = screenToWorld(svg?.clientWidth ?? 0, 0).x;
  const yTop = screenToWorld(0, svg?.clientHeight ?? 0).y;
  const yBottom = screenToWorld(0, 0).y;

  // For some reason, x and y are swapped here, but it works so I'm not touching it. ¯\_(ツ)_/¯
  const xBounds = xRange ?? [Math.floor(yTop), Math.ceil(yBottom)];
  const yBounds = yRange ?? [Math.floor(xLeft), Math.ceil(xRight)];

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
  }, [grid.gap, screenToWorld, worldToScreen, xBounds, yBounds]);

  return (
    <g>
      {grid.visible &&
        xLines.map((line, i) => (
          <line
            key={i}
            {...line}
            stroke={grid.stroke}
            strokeWidth={grid.strokeWidth}
            {...props}
          />
        ))}
      {grid.visible &&
        yLines.map((line, i) => (
          <line
            key={i}
            {...line}
            stroke={grid.stroke}
            strokeWidth={grid.strokeWidth}
            {...props}
          />
        ))}
      {axes.visible && xAxis && (
        <line
          {...xAxis}
          stroke={axes.stroke}
          strokeWidth={axes.strokeWidth}
          {...props}
        />
      )}
      {axes.visible && yAxis && (
        <line
          {...yAxis}
          stroke={axes.stroke}
          strokeWidth={axes.strokeWidth}
          {...props}
        />
      )}
    </g>
  );
}
