import { useEffect, useState } from "react";
import Line from "./Line";
import Point from "./Point";

type VectorOptions = {
  stroke?: string;
  strokeWidth?: number;
  draggable?: "x" | "y" | "both" | "none";
  snapToGrid?: boolean;
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
  } = options ?? {};

  const [to, setTo] = useState({
    x: base.x + x,
    y: base.y + y,
  });
  useEffect(() => {
    setTo({
      x: base.x + x,
      y: base.y + y,
    });
  }, [base, x, y]);

  return (
    <>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="4"
          orient="auto"
        >
          <path d="M 0 0 L 10 4 L 0 8 z" fill={stroke} />
        </marker>
      </defs>
      <Line
        from={base}
        to={to}
        options={{ stroke, strokeWidth, markerEnd: "url(#arrowhead)" }}
      />
      <Point
        x={to.x}
        y={to.y}
        onDrag={(x, y) => {
          setTo({ x, y });
          onDrag?.(x, y);
        }}
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
