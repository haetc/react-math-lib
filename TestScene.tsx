import { useState } from "react";
import katex from "katex";
import Board from "./Board";
import Point from "./Point";
import Line from "./Line";
import FunctionPlot from "./FunctionPlot";
import Grid from "./Grid";

export default function TestScene() {
  const [p1, setP1] = useState({ x: 1, y: 1 });
  const [p2, setP2] = useState({ x: 2, y: 2 });
  const [p3, setP3] = useState({ x: -1, y: 1 });
  const [a, setA] = useState(0.5);

  const polynomial = (x: number) => {
    // The polynomial that passes through the three given points
    // It's the lagrange polynomial
    const l1 = (x: number) =>
      ((x - p2.x) * (x - p3.x)) / ((p1.x - p2.x) * (p1.x - p3.x));
    const l2 = (x: number) =>
      ((x - p1.x) * (x - p3.x)) / ((p2.x - p1.x) * (p2.x - p3.x));
    const l3 = (x: number) =>
      ((x - p1.x) * (x - p2.x)) / ((p3.x - p1.x) * (p3.x - p2.x));
    return l1(x) * p1.y + l2(x) * p2.y + l3(x) * p3.y + a;
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="range"
        min={0}
        max={10}
        step={0.1}
        value={a}
        onChange={(e) => setA(+e.target.value)}
      />
      <div>
        <span
          dangerouslySetInnerHTML={{
            __html: katex.renderToString("a = " + a),
          }}
        />
      </div>
      <Board
        className="w-full h-[500px] border rounded-md bg-white"
        options={{
          unit: 50,
        }}
      >
        <Grid
          options={{
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
              strokeWidth: 1,
            },
          }}
        />
        <FunctionPlot f={polynomial} />
        <Point x={p1.x} y={p1.y} onDrag={(x, y) => setP1({ x, y })} />
        <Point x={p2.x} y={p2.y} onDrag={(x, y) => setP2({ x, y })} />
        <Point x={p3.x} y={p3.y} onDrag={(x, y) => setP3({ x, y })} />
      </Board>
    </div>
  );
}
