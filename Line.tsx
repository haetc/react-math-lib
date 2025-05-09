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
  const finalOptions = {
    ...defaultLineOptions,
    ...options,
  };

  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={finalOptions.stroke}
      strokeWidth={finalOptions.strokeWidth}
    />
  );
}
