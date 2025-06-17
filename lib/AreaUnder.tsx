import { boardContext } from "./Board";
import { functionPlotContext } from "./FunctionPlot";
import { useContext } from "react";

type AreaUnderOptions = {
  fill: string;
  stroke: string;
  strokeWidth: number;
};

type Props = {
  interval: [number, number];
  options?: Partial<AreaUnderOptions>;
};

export default function AreaUnder({ interval, options }: Props) {
  const { points, f } = useContext(functionPlotContext);
  const { worldToScreen } = useContext(boardContext);
  const {
    fill = "rgba(0, 0, 0, 0.1)",
    stroke = "black",
    strokeWidth = 1,
  } = options ?? {};

  if (!f) {
    throw new Error("AreaUnder must be used within a FunctionPlot");
  }

  // If interval is given in the wrong order, swap before proceeding
  if (interval[0] > interval[1]) {
    interval = [interval[1], interval[0]];
  }

  // TODO: Limit the interval to the function's interval

  // If the interval is [a, b], the points will be:
  // (a, 0) (b, 0) (b, f(b)) (a, f(a)) and all the function points between f(a) and f(b)
  const allPoints = [
    { x: interval[0], y: 0 },
    { x: interval[0], y: f(interval[0]) },
    ...points.filter((p) => p.x >= interval[0] && p.x <= interval[1]),
    { x: interval[1], y: f(interval[1]) },
    { x: interval[1], y: 0 },
    { x: interval[0], y: 0 },
  ];

  const screenPoints = allPoints.map((p) => worldToScreen(p.x, p.y));
  const pathData =
    `M ${screenPoints[0].x},${screenPoints[0].y} ` +
    screenPoints
      .slice(1)
      .map((p) => `L ${p.x},${p.y}`)
      .join(" ");

  return (
    <path fill={fill} stroke={stroke} strokeWidth={strokeWidth} d={pathData} />
  );
}
