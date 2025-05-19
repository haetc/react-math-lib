import { createContext, useContext, useEffect, useState } from "react";
import { boardContext } from "./Board";
import { sampleFunction } from "./adaptive-sampler";

type FunctionPlotContextType = {
  points: { x: number; y: number }[];
  f?: (x: number) => number;
};

export const functionPlotContext = createContext<FunctionPlotContextType>({
  // Points are in world coordinates
  points: [],
  f: undefined,
});

export type FunctionPlotOptions = {
  interval: [number, number];
  stroke: string;
  strokeWidth: number;
};

type Props = {
  f: (x: number) => number;
  options?: Partial<FunctionPlotOptions>;
  children?: React.ReactNode;
};

export default function FunctionPlot({ f, options, children }: Props) {
  const { worldToScreenLength, worldToScreen, screenToWorld, svg } =
    useContext(boardContext);

  const { interval, stroke = "black", strokeWidth = 1 } = options ?? {};

  // Calculate the edges of the viewport in world coordinates
  const xLeft = screenToWorld(0, 0).x;
  const xRight = screenToWorld(svg?.clientWidth ?? 0, 0).x;

  // If no interval is provided, use the viewport edges (with a small buffer)
  const xMin = interval?.[0] ?? Math.floor(xLeft) - 0.123;
  const xMax = interval?.[1] ?? Math.ceil(xRight) + 0.321;

  // Points are in world coords
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  useEffect(() => {
    const sampledPoints = sampleFunction(f, {
      xMin,
      xMax,
    });

    setPoints(sampledPoints);
  }, [f, xMin, xMax, worldToScreen]);

  // Generate pathData by creating segments separated by non-finite points
  let newPathData = "";
  const currentScreenSegment: { x: number; y: number }[] = [];

  for (const p of points) {
    if (Number.isFinite(p.y)) {
      currentScreenSegment.push(worldToScreen(p.x, p.y));
    } else {
      if (currentScreenSegment.length > 1) {
        if (newPathData !== "") newPathData += " ";
        newPathData += `M ${currentScreenSegment[0].x} ${currentScreenSegment[0].y} `;
        newPathData += currentScreenSegment
          .slice(1)
          .map((sp) => `L ${sp.x} ${sp.y}`)
          .join(" ");
      }
      currentScreenSegment.length = 0;
    }
  }

  if (currentScreenSegment.length > 1) {
    if (newPathData !== "") newPathData += " ";
    newPathData += `M ${currentScreenSegment[0].x} ${currentScreenSegment[0].y} `;
    newPathData += currentScreenSegment
      .slice(1)
      .map((sp) => `L ${sp.x} ${sp.y}`)
      .join(" ");
  }

  const pathData = newPathData;

  return (
    <functionPlotContext.Provider value={{ points, f }}>
      <path
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        d={pathData}
      />
      {children}
    </functionPlotContext.Provider>
  );
}
