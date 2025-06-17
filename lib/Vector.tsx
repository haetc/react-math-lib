import { useEffect, useState } from "react";
import Line from "./Line";
import Point from "./Point";

type VectorOptions = {
  stroke?: string;
  strokeWidth?: number;
  draggable?: "x" | "y" | "both" | "none";
  snapToGrid?: boolean;
  arrowScale?: number;
};

type Props = {
  x: number;
  y: number;
  base?: { x: number; y: number };
  onDrag?: (x: number, y: number) => void;
  options?: Partial<VectorOptions>;
};

export default function Vector({
  base = { x: 0, y: 0 },
  x,
  y,
  onDrag,
  options,
}: Props) {
  const {
    stroke = "black",
    strokeWidth = 1,
    draggable = "both",
    snapToGrid = false,
    arrowScale = 1,
  } = options ?? {};

  const [coords, setCoords] = useState({ x, y });
  useEffect(() => {
    setCoords({ x, y });
  }, [x, y]);

  const tip = {
    x: base.x + coords.x,
    y: base.y + coords.y,
  };

  function handleDrag(x: number, y: number) {
    // Calculate new coords based on the new tip position
    const newCoords = {
      x: x - base.x,
      y: y - base.y,
    };
    setCoords(newCoords);
    onDrag?.(newCoords.x, newCoords.y);
  }

  return (
    <>
      <defs>
        <marker
          id="arrowhead"
          markerWidth={10 * arrowScale}
          markerHeight={10 * arrowScale}
          refX={5 * arrowScale}
          refY={4 * arrowScale}
          orient="auto"
        >
          <path
            d={`M 0 0 L ${10 * arrowScale} ${4 * arrowScale} L 0 ${
              8 * arrowScale
            } z`}
            fill={stroke}
          />
        </marker>
      </defs>
      <Line
        from={base}
        to={tip}
        options={{ stroke, strokeWidth, markerEnd: "url(#arrowhead)" }}
      />
      <Point
        x={tip.x}
        y={tip.y}
        onDrag={(x, y) => handleDrag(x, y)}
        options={{
          draggable,
          fill: "none",
          radius: 0,
          snapToGrid,
        }}
      />
    </>
  );
}
