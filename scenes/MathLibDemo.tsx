import { useState } from "react";

import Grid, { type GridOptions } from "../Grid";
import Board, { type BoardOptions } from "../Board";
import FunctionPlot from "../FunctionPlot";
import Point from "../Point";

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
  return (
    <>
      <Board className="w-full h-[300px] border rounded-md bg-white">
        <Grid />
      </Board>
    </>
  );
}

export function Scene2() {
  return (
    <>
      <Board className="w-full h-[300px] border rounded-md bg-white">
        <Grid options={gridOptions} />
      </Board>
    </>
  );
}

export function Scene3() {
  const [m, setM] = useState(1);
  const [p, setP] = useState({ x: 0, y: 0 });

  return (
    <>
      <input
        type="range"
        min={-10}
        max={10}
        step={0.1}
        value={m}
        onChange={(e) => setM(+e.target.value)}
      />
      <Board className="w-full h-[300px] border rounded-md bg-white">
        <Grid options={gridOptions} />
        <Point x={p.x} y={p.y} onDrag={(x, y) => setP({ x, y })} />
        <FunctionPlot f={(x) => m * (x - p.x) + p.y} />
      </Board>
    </>
  );
}
