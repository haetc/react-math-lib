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
  step: number;
  stroke: string;
  strokeWidth: number;
};

const defaultFunctionPlotOptions: FunctionPlotOptions = {
  interval: [-10, 10],
  step: 0.1,
  stroke: "black",
  strokeWidth: 1,
};

type Props = {
  f: (x: number) => number;
  options?: Partial<FunctionPlotOptions>;
  children?: React.ReactNode;
};

export default function FunctionPlot({ f, options, children }: Props) {
  const { worldToScreenLength, worldToScreen, svg } = useContext(boardContext);

  const finalOptions = {
    ...defaultFunctionPlotOptions,
    ...options,
  };

  // Points are in world coords
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  useEffect(() => {
    const sampledPoints = sampleFunction(f, {
      xMin: finalOptions.interval[0],
      xMax: finalOptions.interval[1],
    });
    setPoints(sampledPoints);
  }, [f, finalOptions.interval, worldToScreen]);

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
        stroke={finalOptions.stroke}
        strokeWidth={finalOptions.strokeWidth}
        d={pathData}
      />
      {children}
    </functionPlotContext.Provider>
  );
}
