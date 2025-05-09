import { useContext } from "react";
import { boardContext } from "./Board";

type LineOptions = {
  stroke?: string;
  strokeWidth?: number;
};

const defaultLineOptions: LineOptions = {
  stroke: "black",
  strokeWidth: 1,
};

type Props = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  options?: Partial<LineOptions>;
};

export default function Line({ from, to, options }: Props) {
  const { worldToScreen, screenToWorld } = useContext(boardContext);

  const finalOptions = {
    ...defaultLineOptions,
    ...options,
  };

  // Screen coords
  const screenFrom = worldToScreen(from.x, from.y);
  const screenTo = worldToScreen(to.x, to.y);

  return (
    <line
      x1={screenFrom.x}
      y1={screenFrom.y}
      x2={screenTo.x}
      y2={screenTo.y}
      stroke={finalOptions.stroke}
      strokeWidth={finalOptions.strokeWidth}
    />
  );
}
