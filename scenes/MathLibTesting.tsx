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
    strokeWidth: 1,
  },
};

export function Scene1() {
  const [p2, setP2] = useState({ x: 2, y: 2 });
  const [a, setA] = useState(0.5);
  const quadratic = (x: number) => {
    return a * (x - p2.x) * (x - p2.x) + p2.y;
  };

  const [t1, setT1] = useState(0);
  const [t2, setT2] = useState(1);

  return (
    <Board
      className="w-full h-[500px] border rounded-md bg-white"
      options={boardOptions}
    >
      <Grid options={gridOptions} />
      <FunctionPlot
        f={(x) => Math.sin(a / x)}
        options={{
          interval: [-10, 10],
          step: 0.01,
        }}
      />
      <FunctionPlot f={quadratic}>
        <AreaUnder
          interval={[t1, t2]}
          options={{
            fill: "rgba(255, 0, 0, 0.1)",
            stroke: "red",
            strokeWidth: 2,
          }}
        />
      </FunctionPlot>
      <Point
        x={t1}
        y={0}
        options={{ draggable: "x" }}
        onDrag={(x, y) => setT1(x)}
      />
      <Point
        x={t2}
        y={0}
        options={{ draggable: "x" }}
        onDrag={(x, y) => setT2(x)}
      />
      <Point x={p2.x} y={p2.y} onDrag={(x, y) => setP2({ x, y })} />
      <Vector
        x={1 + a}
        y={1}
        base={{ x: t1, y: 0 }}
        options={{
          stroke: "red",
          strokeWidth: 2,
          arrowScale: 0.8,
          snapToGrid: true,
        }}
      />

      <Overlay className="p-4 [&_*]:pointer-events-auto">
        <div className="flex flex-col gap-2 w-48 px-4 py-2 bg-neutral-50 border rounded-md">
          <span
            dangerouslySetInnerHTML={{
              __html: katex.renderToString("a = " + a),
            }}
          />
          <input
            type="range"
            min={-5}
            max={5}
            step={0.01}
            value={a}
            onChange={(e) => setA(+e.target.value)}
          />
        </div>
      </Overlay>
    </Board>
  );
}
