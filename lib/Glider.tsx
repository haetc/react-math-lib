import type { PointOptions } from "./Point";
import Point from "./Point";
import { functionPlotContext } from "./FunctionPlot";
import { useContext, useEffect, useState } from "react";

type GliderOptions = Omit<PointOptions, "draggable">;

type Props = {
  x: number;
  onDrag?: (x: number, y: number) => void;
  options?: Partial<GliderOptions>;
};

export default function Glider({ x, onDrag, options }: Props) {
  const { fill = "black", radius = 5 } = options ?? {};
  const { f } = useContext(functionPlotContext);

  if (!f) {
    throw new Error("Glider must be used within a FunctionPlot");
  }

  const [xValue, setXValue] = useState(x);
  useEffect(() => {
    setXValue(x);
  }, [x]);

  const y = f(xValue);

  return (
    <Point
      x={xValue}
      y={y}
      onDrag={(x) => {
        setXValue(x);
        onDrag?.(x, f(x));
      }}
      options={{ fill, radius, draggable: "x" }}
    />
  );
}
