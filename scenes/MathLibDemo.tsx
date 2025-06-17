import { useState } from "react";

import Grid, { type GridOptions } from "../Grid";
import Board, { type BoardOptions } from "../Board";
import FunctionPlot from "../FunctionPlot";
import Point from "../Point";
import Overlay from "../Overlay";
import InlineMath from "../InlineMath";
import AreaUnder from "../AreaUnder";

const boardOptions: Partial<BoardOptions> = {
  unit: 50,
};

const gridOptions: Partial<GridOptions> = {
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

export function DemoScene() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(5);
  const [c, setC] = useState(1);

  const f = (x: number) => Math.E ** (-x / c);
  const integral = (x: number) => -c * Math.E ** (-x / c);

  return (
    <>
      <Board className="w-full h-[500px] border rounded-md bg-white">
        <Grid options={gridOptions} />
        <FunctionPlot f={f} options={{ strokeWidth: 2, stroke: "blue" }}>
          <AreaUnder
            interval={[a, b]}
            options={{
              fill: "rgba(0, 0, 255, 0.2)",
              strokeWidth: 2,
              stroke: "blue",
            }}
          />
        </FunctionPlot>
        <Point
          x={a}
          y={0}
          options={{ draggable: "x", fill: "red" }}
          onDrag={(x) => setA(x)}
        />
        <Point
          x={b}
          y={0}
          options={{ draggable: "x", fill: "red" }}
          onDrag={(x) => setB(x)}
        />
        <Overlay className="p-4 flex flex-col gap-2">
          <div className="flex flex-col gap-2 bg-white/10 backdrop-blur-xs border p-2 rounded-md max-w-48">
            <InlineMath className="text-black" latex={`c = ${c.toFixed(1)}`} />
            <input
              type="range"
              min={1}
              max={10}
              step={0.1}
              value={c}
              onChange={(e) => setC(+e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-auto bg-white/10 backdrop-blur-xs border p-4 rounded-md max-w-fit">
            <InlineMath
              className="text-black [&_.katex-display]:!m-0 [&_.katex]:!p-2"
              latex={String.raw`\int_a^b e^{-x/c} \ dx = ${(
                integral(b) - integral(a)
              ).toFixed(2)}`}
              options={{
                displayMode: true,
              }}
            />
          </div>
        </Overlay>
      </Board>
    </>
  );
}

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
