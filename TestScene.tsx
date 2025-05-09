import { useState } from "react";
import Board from "./Board";
import Point from "./Point";
import Line from "./Line";
import FunctionPlot from "./FunctionPlot";
import Grid from "./Grid";

export default function TestScene() {
  const [p1, setP1] = useState({ x: 1, y: 1 });
  const [p2, setP2] = useState({ x: 2, y: 2 });
  const [p3, setP3] = useState({ x: -1, y: 1 });

  const polynomial = (x: number) => {
    // The polynomial that passes through the three given points
    // It's the lagrange polynomial
    const l1 = (x: number) =>
      ((x - p2.x) * (x - p3.x)) / ((p1.x - p2.x) * (p1.x - p3.x));
    const l2 = (x: number) =>
      ((x - p1.x) * (x - p3.x)) / ((p2.x - p1.x) * (p2.x - p3.x));
    const l3 = (x: number) =>
      ((x - p1.x) * (x - p2.x)) / ((p3.x - p1.x) * (p3.x - p2.x));
    return l1(x) * p1.y + l2(x) * p2.y + l3(x) * p3.y;
  };

  return (
    <Board
      className="w-full h-[500px] border rounded-md bg-white"
      options={{
        unit: 50,
      }}
    >
      <Grid />
      <FunctionPlot f={polynomial} />
      <Point x={p1.x} y={p1.y} onDrag={(x, y) => setP1({ x, y })} />
      <Point x={p2.x} y={p2.y} onDrag={(x, y) => setP2({ x, y })} />
      <Point x={p3.x} y={p3.y} onDrag={(x, y) => setP3({ x, y })} />
    </Board>
  );
}
