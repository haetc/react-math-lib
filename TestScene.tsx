import { useState } from "react";
import Board from "./Board";
import Point from "./Point";
import Line from "./Line";

export default function TestScene() {
  const [p1, setP1] = useState({ x: 100, y: 100 });
  const p2 = { x: p1.x * 2, y: p1.y * 2 };

  return (
    <Board
      className="w-full h-[500px] border rounded-md bg-white"
      options={{
        gap: 30,
      }}
    >
      <Line from={p1} to={p2} />
      <Point
        x={p1.x}
        y={p1.y}
        options={{ fill: "red", radius: 10 }}
        onDrag={(x, y) => setP1({ x, y })}
      />
      <Point x={p2.x} y={p2.y} options={{ draggable: false }} />
    </Board>
  );
}
