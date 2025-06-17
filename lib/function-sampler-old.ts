// Takes a function and returns an array of points
// The arguments are: function, interval, step
// TODO: Replace this with a more robust sampling algorithm
export default function sampleFunction(
  f: (x: number) => number,
  interval: [number, number],
  step: number
) {
  const points = [];
  for (let x = interval[0]; x <= interval[1]; x += step) {
    points.push({ x, y: f(x) });
  }
  return points;
}

// NEW ALGORITHM TEST
type Point = {
  x: number;
  y: number;
};

type SamplerOptions = {
  maxRecursions?: number;
  pixelError?: number;
  jumpThreshold?: number;
};

// The intervals are in world coordinates. Width and height are in pixels (screen coords)
// Returns an array of arrays of points. Each array is a continuous segment of the function.
export function adaptiveSampler(
  f: (x: number) => number,
  xMin: number,
  xMax: number,
  widthPx: number,
  yMin: number,
  yMax: number,
  heightPx: number,
  options: SamplerOptions = {}
) {
  // Default options
  const { maxRecursions = 10, pixelError = 0.5, jumpThreshold = 50 } = options;
  const yRange = Math.max(yMax - yMin, 1e-12);
  const yScale = yRange / heightPx;
  const jumpAbs = jumpThreshold * yRange;

  const xScale = Math.max(1e-12, (xMax - xMin) / widthPx);
  const maxSegPx = 4;

  // Helpers
  const result: Point[][] = [];
  let current: Point[] = [];

  function flush() {
    if (current.length > 1) {
      result.push(current);
      current = [];
    }
  }

  function addPoint(p: Point) {
    if (!Number.isFinite(p.y)) {
      flush();
      return;
    }

    if (
      current.length > 0 &&
      Math.abs(p.y - current[current.length - 1].y) > jumpAbs
    ) {
      flush();
    }

    current.push(p);
  }

  // Recursive subdivision
  function subdivide(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    depth: number
  ) {
    // Base case
    if (depth > maxRecursions || !Number.isFinite(y0) || !Number.isFinite(y1)) {
      addPoint({ x: x0, y: y0 });
      return;
    }

    const xMid = (x0 + x1) / 2;
    const yMid = f(xMid);

    // Needs more detail
    let needsRefine = false;
    if (Number.isFinite(yMid)) {
      const chordMid = (y0 + y1) / 2;
      const errPx = Math.abs(yMid - chordMid) / yScale;
      needsRefine = errPx > pixelError;
    } else {
      needsRefine = true;
    }

    if (!needsRefine) {
      const segLenPx = Math.abs(x1 - x0) / xScale;
      if (segLenPx > maxSegPx) {
        needsRefine = true;
      }
    }

    if (needsRefine) {
      subdivide(x0, y0, xMid, yMid, depth + 1);
      subdivide(xMid, yMid, x1, y1, depth + 1);
    } else {
      addPoint({ x: x0, y: y0 });
    }
  }

  // Start with the outer segment
  const y0 = f(xMin);
  const y1 = f(xMax);
  subdivide(xMin, y0, xMax, y1, 0);
  addPoint({ x: xMax, y: y1 });
  flush();

  return result;
}

// Helper function to convert a list of points to a SVG path string
function polyPathToString(points: Point[]) {
  return points.length > 0
    ? `M ${points[0].x} ${points[0].y}` +
        points
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(" ")
    : "";
}
