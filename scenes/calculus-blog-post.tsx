import { useState } from "react";
import Board from "../Board";
import FunctionPlot, { type FunctionPlotOptions } from "../FunctionPlot";
import Grid from "../Grid";
import Point from "../Point";

const boardStyles = "w-[90%] mx-auto h-[500px] border rounded-md bg-white";

const func = (x: number) => {
  if (x <= 0) return 0;
  return Math.log(x);
};

const derivative = (x: number) => {
  if (x <= 0) return 0;
  return 1 / x;
};

const boardOptions = {
  unit: 70,
  pan: {
    enabled: false,
  },
  zoom: {
    enabled: false,
  },
};

const gridOptions = {
  grid: {
    strokeWidth: 0.5,
    stroke: "black",
    visible: true,
    gap: 1,
  },
};

const functionPlotOptions: Partial<FunctionPlotOptions> = {
  interval: [0.001, 10],
  strokeWidth: 3,
  stroke: "#663399",
  step: 0.01,
};

export function InitialGraph() {
  return (
    <Board className={boardStyles} options={boardOptions}>
      <Grid options={gridOptions} />
      <FunctionPlot f={func} options={functionPlotOptions} />
    </Board>
  );
}

export function SlopeDemonstration() {
  const [x, setX] = useState(1);
  const slope = derivative(x);

  // Line equation with slope and a point
  const line = (input: number) => {
    return slope * (input - x) + func(x);
  };

  return (
    <Board className={boardStyles} options={boardOptions}>
      <Grid options={gridOptions} />
      <FunctionPlot f={func} options={functionPlotOptions} />
      <FunctionPlot
        f={line}
        options={{
          interval: [-10, 10],
          stroke: "darkblue",
          strokeWidth: 2,
        }}
      />
      <Point
        // TODO: This point being constrained to a function is a bit of a hack,
        // Implement constained points by putting them inside the function plot
        x={x}
        y={func(x)}
        onDrag={(x) => setX(x)}
      />
    </Board>
  );
}
