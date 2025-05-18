import { createContext, useContext, useEffect, useState } from "react";
import { boardContext } from "./Board";
import { adaptiveSampler } from "./adaptive-sampler";
import { sampleFunction } from "./adaptive-sampler2";

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
    const points = sampleFunction(f, {
      xMin: finalOptions.interval[0],
      xMax: finalOptions.interval[1],
      maxPoints: 5000,
    });

    // Temporary flatting to test
    setPoints(points);
  }, [f, finalOptions.interval, finalOptions.step, worldToScreen]);

  // Converted to screen coords here for rendering
  const screenPoints = points.map((p) => worldToScreen(p.x, p.y));

  const pathData =
    screenPoints.length > 0
      ? `M ${screenPoints[0].x} ${screenPoints[0].y} ` +
        screenPoints
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(" ")
      : "";

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
