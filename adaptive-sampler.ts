type Point = {
  x: number;
  y: number;
};

type SamplerOptions = {
  domain?: [number, number];
  maxPoints?: number; // Default: 5000
  minDyAbs?: number; // Default: 0
  minDyRel?: number; // Default: 1e-3

  maxCurvature?: number; // Default: 0.1736 (sin 10)
  minDx?: number; // Default: 1e-6
  undefinedStrategy?: "split" | "nan"; // Default: "split"
};

type Sample = {
  x: number;
  y: number;
  badness: number;
};

const isFin = (x: number) => Number.isFinite(x);

function updateBadness(
  samples: Sample[],
  i: number,
  options: Required<SamplerOptions>,
  yMin: number,
  yMax: number
) {
  if (i <= 0 || i + 1 >= samples.length) {
    return;
  }

  const p = samples[i - 1];
  const s = samples[i];
  const n = samples[i + 1];

  if (!isFin(p.y) || !isFin(s.y) || !isFin(n.y)) {
    samples[i - 1].badness = 0;
    return;
  }

  const dxP = s.x - p.x;
  const dxN = n.x - s.x;

  if (dxP < options.minDx && dxN < options.minDx) {
    samples[i - 1].badness = 0;
    return;
  }

  if (
    Math.abs(s.y - p.y) < options.minDyAbs &&
    Math.abs(n.y - s.y) < options.minDyAbs
  ) {
    samples[i - 1].badness = 0;
    return;
  }

  const dySpan = yMax - yMin || 1;
  const minDy = dySpan * options.minDyRel;

  if (Math.abs(s.y - p.y) < minDy && Math.abs(n.y - s.y) < minDy) {
    samples[i - 1].badness = 0;
    return;
  }

  const dx0 = dxP / (n.x - p.x);
  const dx1 = dxN / (n.x - p.x);
  const dy0 = (s.y - p.y) / dySpan;
  const dy1 = (n.y - s.y) / dySpan;
  const il0 = 1 / Math.hypot(dx0, dy0);
  const il1 = 1 / Math.hypot(dx1, dy1);
  const sin0 = (dx0 * dy1 - dy0 * dx1) * il0 * il1;

  if (Math.abs(sin0) <= options.maxCurvature) {
    samples[i - 1].badness = 0;
    return;
  }

  const area = Math.abs(dxP * (n.y - s.y) - dxN * (s.y - p.y));
  samples[i - 1].badness = area;
}

function insertSample(samples: Sample[], x: number, y: number) {
  let lo = 0;
  let hi = samples.length;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (x < samples[mid].x) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  samples.splice(lo, 0, { x, y, badness: 0 });
  return lo;
}

export function adaptiveSampler(
  f: (x: number) => number,
  options: SamplerOptions
): Point[][] {
  const opts: Required<SamplerOptions> = {
    domain: options.domain ?? [-10, 10],
    maxPoints: options.maxPoints ?? 5000,
    minDyAbs: options.minDyAbs ?? 0,
    minDyRel: options.minDyRel ?? 1e-3,
    maxCurvature: options.maxCurvature ?? 0.1736,
    minDx: options.minDx ?? 1e-6,
    undefinedStrategy: options.undefinedStrategy ?? "split",
  };

  const [xMin, xMax] = opts.domain;
  if (xMax < xMin) {
    throw new Error("xMax must be greater than xMin");
  }

  const samples: Sample[] = [
    { x: xMin, y: f(xMin), badness: 0 },
    { x: xMax, y: f(xMax), badness: 0 },
  ];
  samples[0].badness = Number.POSITIVE_INFINITY;

  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;

  samples.forEach((s) => {
    if (isFin(s.y)) {
      yMin = Math.min(yMin, s.y);
      yMax = Math.max(yMax, s.y);
    }
  });

  updateBadness(samples, 1, opts, yMin, yMax);

  // Refinement
  while (samples.length < opts.maxPoints) {
    let worst = 0;
    let idx = -1;

    for (let i = 0; i < samples.length - 1; i++) {
      if (samples[i].badness > worst) {
        worst = samples[i].badness;
        idx = i;
      }
    }

    if (idx === -1) {
      break;
    }

    const sL = samples[idx];
    const sR = samples[idx + 1];
    const xMid = (sL.x + sR.x) / 2;
    if (sR.x - sL.x < opts.minDx) {
      samples[idx].badness = 0;
      continue;
    }

    const yMid = f(xMid);
    const midPos = insertSample(samples, xMid, yMid);
    if (isFin(yMid)) {
      yMin = Math.min(yMin, yMid);
      yMax = Math.max(yMax, yMid);
    }

    updateBadness(samples, midPos, opts, yMin, yMax);

    if (samples[midPos].badness < worst) {
      worst = samples[midPos].badness;
    }

    if (midPos > 0) {
      updateBadness(samples, midPos, opts, yMin, yMax);
    }

    if (midPos + 1 < samples.length) {
      updateBadness(samples, midPos + 1, opts, yMin, yMax);
    }
  }

  // Output
  // nan strategy
  if (opts.undefinedStrategy === "nan") {
    return [
      samples.map((s) => ({
        x: s.x,
        y: isFin(s.y) ? s.y : NaN,
      })),
    ];
  }

  // split strategy
  const segments: Point[][] = [];
  let current: Point[] = [];
  for (const s of samples) {
    if (!isFin(s.y)) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      continue;
    }

    current.push({ x: s.x, y: s.y });
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments;
}
