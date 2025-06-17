import { useState } from "react";
import katex from "katex";

import Grid, { type GridOptions } from "../Grid";
import Board, { type BoardOptions } from "../Board";
import Point from "../Point";
import FunctionPlot from "../FunctionPlot";
import Glider from "../Glider";
import AreaUnder from "../AreaUnder";
import Vector from "../Vector";
import Overlay from "../Overlay";

const boardOptions: Partial<BoardOptions> = {
  unit: 50,
};

const gridOptions: Partial<GridOptions> = {
  xRange: [-10, 10],
  yRange: [-10, 10],
  grid: {
    visible: true,
    stroke: "#ccc",
    strokeWidth: 0.5,
    gap: 1,
  },
  axes: {
    visible: true,
    stroke: "#000",
    strokeWidth: 2,
  },
};

export function Scene1() {
  const [a, setA] = useState(0.5);

  return (
    <>
      <div>
        <input
          type="range"
          min={-5}
          max={5}
          step={0.01}
          value={a}
          onChange={(e) => setA(+e.target.value)}
        />
        <span>{a}</span>
      </div>
      <Board
        className="w-full h-[300px] border rounded-md bg-white"
        options={boardOptions}
      >
        <Grid options={gridOptions} />
        <FunctionPlot f={(x) => a / (x - 5)} />
      </Board>
      <Board
        className="w-full h-[300px] border rounded-md bg-white"
        options={boardOptions}
      >
        <Grid options={gridOptions} />
        <FunctionPlot f={(x) => Math.sin(a / x)} />
        <FunctionPlot f={(x) => Math.sin(a * x)} />
      </Board>
    </>
  );
}
