import { useContext, useEffect, useState } from "react";
import { boardContext } from "./Board";
import Point from "./Point";

type FunctionPlotOptions = {
  interval: [number, number];
  step: number;
  stroke: string;
  strokeWidth: number;
};

const defaultFunctionPlotOptions: FunctionPlotOptions = {
  interval: [0, 800],
  step: 1,
  stroke: "black",
  strokeWidth: 1,
};

type Props = {
  f: (x: number) => number;
  options?: Partial<FunctionPlotOptions>;
};

export default function FunctionPlot({ f, options }: Props) {
  const finalOptions = {
    ...defaultFunctionPlotOptions,
    ...options,
  };

  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  useEffect(() => {
    const points = [];
    for (
      let x = finalOptions.interval[0];
      x <= finalOptions.interval[1];
      x += finalOptions.step
    ) {
      points.push({ x, y: f(x) });
    }
    setPoints(points);
  }, [f, finalOptions.interval, finalOptions.step]);

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
