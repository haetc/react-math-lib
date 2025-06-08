import { useState } from "react";
import Board from "../Board";
import FunctionPlot, { type FunctionPlotOptions } from "../FunctionPlot";
import Grid from "../Grid";
import Point from "../Point";
import Overlay from "../Overlay";
import InlineMath from "../InlineMath";

const boardStyles =
  "w-[90%] mx-auto h-[500px] border-2 border-[var(--md-border)] rounded-md bg-[var(--background)]/50 text-[var(--foreground)]";

const gridClassName = "!stroke-[var(--foreground)]";

const func = (x: number) => {
  return Math.exp(-x / 2);
};
const derivative = (x: number) => {
  return (-1 / 2) * Math.exp(-x / 2);
};

const boardOptions = {
  unit: 70,
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
  strokeWidth: 3,
  stroke: "#663399",
};

export function InitialGraph() {
  return (
    <Board className={boardStyles} options={boardOptions}>
      <Grid options={gridOptions} className={gridClassName} />
      <FunctionPlot
        f={func}
        options={functionPlotOptions}
        className="!stroke-[var(--md-link)]"
      />
      <Overlay className="p-4">
        <InlineMath className="text-xl" latex="f(x) = e^{-x/2}" />
      </Overlay>
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
      <Grid options={gridOptions} className={gridClassName} />
      <FunctionPlot
        f={func}
        options={functionPlotOptions}
        className="!stroke-[var(--md-link)]"
      />
      <FunctionPlot
        f={line}
        options={{
          strokeWidth: 2.5,
        }}
        className="!stroke-blue-400"
      />
      <Point
        // TODO: This point being constrained to a function is a bit of a hack,
        // Implement constained points by putting them inside the function plot
        x={x}
        y={func(x)}
        onDrag={(x) => setX(x)}
        options={{ draggable: "x" }}
        className="!stroke-[var(--foreground)] !fill-[var(--foreground)]"
      />
      <Overlay className="p-2">
        <div className="flex flex-col gap-2 text-lg max-w-max bg-[var(--background)]/50 border-1 border-[var(--md-border)] rounded-md p-2">
          <InlineMath latex="f(x) = e^{-x/2}" />
          <InlineMath latex="f'(x) = -\frac{1}{2}e^{-x/2}" />
          <InlineMath latex={`f'(${x.toFixed(2)}) = ${slope.toFixed(2)}`} />
        </div>
      </Overlay>
    </Board>
  );
}
