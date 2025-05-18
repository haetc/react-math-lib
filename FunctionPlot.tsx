import { createContext, useContext, useEffect, useState } from "react";
import { boardContext } from "./Board";
import Point from "./Point";
import sampleFunction, { adaptiveSampler } from "@/util/function-sampler";

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
    const points = adaptiveSampler(
      f,
      finalOptions.interval[0],
      finalOptions.interval[1],
      svg?.clientWidth ?? 0,
      -10,
      10,
      svg?.clientHeight ?? 0
    );

    // Temporary flatting to test
    setPoints(points.flat());
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
