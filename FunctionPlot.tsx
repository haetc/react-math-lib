import { useContext, useEffect, useState } from "react";
import { boardContext } from "./Board";
import Point from "./Point";
import sampleFunction from "@/util/function-sampler";

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
};

export default function FunctionPlot({ f, options }: Props) {
  const { worldToScreenLength, worldToScreen } = useContext(boardContext);

  const finalOptions = {
    ...defaultFunctionPlotOptions,
    ...options,
  };

  // Points are also in screen coords like all internal state
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  useEffect(() => {
    const points = sampleFunction(f, finalOptions.interval, finalOptions.step);
    const screenPoints = points.map((p) => worldToScreen(p.x, p.y));
    setPoints(screenPoints);
  }, [f, finalOptions.interval, finalOptions.step, worldToScreen]);

  const pathData =
    points.length > 0
      ? `M ${points[0].x},${points[0].y} ` +
        points
          .slice(1)
          .map((p) => `L ${p.x},${p.y}`)
          .join(" ")
      : "";

  return (
    <path
      fill="none"
      stroke={finalOptions.stroke}
      strokeWidth={finalOptions.strokeWidth}
      d={pathData}
    />
  );
}
