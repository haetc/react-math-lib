// Constants for default values, inspired by the C code
const DBL_EPSILON = Number.EPSILON;
const DEFAULT_MIN_DX = 1e-6;
const DEFAULT_MAX_CURVATURE = 0.1736; // sin(10 degrees)
const DEFAULT_MIN_DY_REL = 1e-3;
const DEFAULT_MIN_DY_ABS = 0;
const DEFAULT_INITIAL_POINTS = 11;
const DEFAULT_MAX_POINTS = 1000; // Default cap on total points

type Point = {
  x: number;
  y: number;
};

// Internal representation of a sample
type Sample = Point & {
  // badness of the interval STARTING at this sample and ending at the NEXT sample.
  // So, samples[i].badness is for the interval (samples[i], samples[i+1]).
  // The last sample in the array will typically have badness = 0.
  badness: number;
};

type FunctionSamplerOptions = {
  xMin: number;
  xMax: number;
  minDX?: number; // Minimum x-spacing between samples
  minDYAbs?: number; // Minimum absolute y-change to consider for refinement
  minDYRel?: number; // Minimum relative y-change (to overall y-range) for refinement
  maxCurvature?: number; // Threshold for sin of angle deviation
  initialPoints?: number; // Number of initial points to seed the sampler
  maxPoints?: number; // Maximum number of points to generate in total
};

type ResolvedFunctionSamplerOptions = {
  xMin: number;
  xMax: number;
  minDX: number;
  minDYAbs: number;
  minDYRel: number;
  maxCurvature: number;
  initialPoints: number;
  maxPoints: number;
};

function resolveOptions(
  userOptions: FunctionSamplerOptions
): ResolvedFunctionSamplerOptions {
  let xMin = userOptions.xMin;
  let xMax = userOptions.xMax;

  if (xMin > xMax) {
    [xMin, xMax] = [xMax, xMin]; // Ensure xMin <= xMax
  }

  return {
    xMin,
    xMax,
    minDX: Math.max(DBL_EPSILON, userOptions.minDX ?? DEFAULT_MIN_DX),
    minDYAbs: Math.max(0, userOptions.minDYAbs ?? DEFAULT_MIN_DY_ABS),
    minDYRel: Math.max(0, userOptions.minDYRel ?? DEFAULT_MIN_DY_REL),
    maxCurvature: Math.max(
      DBL_EPSILON, // Curvature must be positive
      Math.min(1, userOptions.maxCurvature ?? DEFAULT_MAX_CURVATURE) // Max sin(theta) is 1
    ),
    initialPoints: Math.max(
      2,
      userOptions.initialPoints ?? DEFAULT_INITIAL_POINTS
    ), // Need at least 2 points for an interval
    maxPoints: Math.max(
      userOptions.initialPoints ?? DEFAULT_INITIAL_POINTS,
      userOptions.maxPoints ?? DEFAULT_MAX_POINTS
    ),
  };
}

export function sampleFunction(
  func: (x: number) => number | undefined | null,
  userOptions: FunctionSamplerOptions
): Point[] {
  const opts = resolveOptions(userOptions);

  const samples: Sample[] = [];
  let numBadIntervals = 0;
  let yMinOverall = Number.POSITIVE_INFINITY; // Use POSITIVE_INFINITY for min init
  let yMaxOverall = Number.NEGATIVE_INFINITY; // Use NEGATIVE_INFINITY for max init

  function evaluateAndSanitizeY(x: number): number {
    let yValue: number | undefined | null;
    try {
      yValue = func(x);
    } catch (e) {
      // As per user request, propagate errors from the user's function
      throw e;
    }

    if (yValue === undefined || yValue === null || Number.isNaN(yValue)) {
      return NaN;
    }

    // yValue is a valid number (possibly Infinity or -Infinity)
    if (Number.isFinite(yValue)) {
      yMinOverall = Math.min(yMinOverall, yValue);
      yMaxOverall = Math.max(yMaxOverall, yValue);
    }
    return yValue;
  }

  function updateBadnessForTriplet(middlePointIndex: number): void {
    if (middlePointIndex <= 0 || middlePointIndex >= samples.length - 1) {
      return; // Not a valid middle point for a triplet
    }

    const sPrev = samples[middlePointIndex - 1];
    const sMid = samples[middlePointIndex];
    const sNext = samples[middlePointIndex + 1];

    const xp = sPrev.x,
      yp = sPrev.y;
    const x0 = sMid.x,
      y0 = sMid.y;
    const xn = sNext.x,
      yn = sNext.y;

    if (xn - x0 < opts.minDX && x0 - xp < opts.minDX) {
      return;
    }

    if (Number.isNaN(yp) || Number.isNaN(y0) || Number.isNaN(yn)) {
      return; // Cannot calculate curvature with NaN values
    }

    if (Number.isFinite(yp) && Number.isFinite(y0) && Number.isFinite(yn)) {
      if (
        Math.abs(y0 - yp) < opts.minDYAbs &&
        Math.abs(yn - y0) < opts.minDYAbs
      ) {
        return;
      }
    }

    const yRangeOverall = yMaxOverall - yMinOverall;
    if (
      yRangeOverall > DBL_EPSILON &&
      Number.isFinite(yp) &&
      Number.isFinite(y0) &&
      Number.isFinite(yn)
    ) {
      const min_dy_from_rel = yRangeOverall * opts.minDYRel;
      if (
        Math.abs(y0 - yp) < min_dy_from_rel &&
        Math.abs(yn - y0) < min_dy_from_rel
      ) {
        return;
      }
    }

    let localYMin = yp;
    if (y0 < localYMin) localYMin = y0;
    if (yn < localYMin) localYMin = yn;
    let localYMax = yp;
    if (y0 > localYMax) localYMax = y0;
    if (yn > localYMax) localYMax = yn;

    const localYRange = localYMax - localYMin;

    if (
      !Number.isFinite(localYMin) ||
      !Number.isFinite(localYMax) ||
      localYRange < DBL_EPSILON
    ) {
      // Collinear vertically, or all y-values effectively the same (e.g. all Infinity or all same finite value)
      // Treat as non-curvy or ill-defined for curvature.
      return;
    }

    const totalXRangeTriplet = xn - xp;
    if (totalXRangeTriplet < DBL_EPSILON) return; // Avoid division by zero if all x are same

    const dx0_norm = (x0 - xp) / totalXRangeTriplet;
    const dx1_norm = (xn - x0) / totalXRangeTriplet;
    const dy0_norm = (y0 - yp) / localYRange;
    const dy1_norm = (yn - y0) / localYRange;

    const len0_norm_sq = dx0_norm * dx0_norm + dy0_norm * dy0_norm;
    const len1_norm_sq = dx1_norm * dx1_norm + dy1_norm * dy1_norm;

    if (
      len0_norm_sq < DBL_EPSILON * DBL_EPSILON ||
      len1_norm_sq < DBL_EPSILON * DBL_EPSILON
    ) {
      return; // Segment length effectively zero in normalized space
    }

    const il0_norm = 1.0 / Math.sqrt(len0_norm_sq);
    const il1_norm = 1.0 / Math.sqrt(len1_norm_sq);

    const sinq =
      (dx0_norm * dy1_norm - dy0_norm * dx1_norm) * il0_norm * il1_norm;

    if (Math.abs(sinq) > opts.maxCurvature) {
      const adx0 = x0 - xp; // actual dx for (sPrev, sMid)
      const adx1 = xn - x0; // actual dx for (sMid, sNext)
      const ady0 = y0 - yp; // actual dy for (sPrev, sMid)
      const ady1 = yn - y0; // actual dy for (sMid, sNext)
      // Area is based on the parallelogram formed by vectors (adx0, ady0) and (adx1, ady1) if placed tail to tail.
      // Or, more directly, area of triangle (xp,yp)-(x0,y0)-(xn,yn) is 0.5 * |xp(y0-yn) + x0(yn-yp) + xn(yp-y0)|.
      // The C code uses area = fabs(adx0*ady1 - adx1*ady0); This is the area of the parallelogram formed by vectors (adx0, ady0) and (adx1, ady1).
      // This value is twice the area of the triangle (xp,yp)-(x0,y0)-(xn,yn).
      // Let's stick to the C code's "area" metric.
      const area = Math.abs(adx0 * ady1 - adx1 * ady0);

      // Update badness for interval (sPrev, sMid), stored in sPrev.badness
      if (adx0 > opts.minDX) {
        // Check if interval sPrev-sMid is wide enough
        if (sPrev.badness <= 0 && area > 0) {
          numBadIntervals++;
        }
        sPrev.badness = Math.max(sPrev.badness, area);
      }

      // Update badness for interval (sMid, sNext), stored in sMid.badness
      if (adx1 > opts.minDX) {
        // Check if interval sMid-sNext is wide enough
        if (sMid.badness <= 0 && area > 0) {
          numBadIntervals++;
        }
        sMid.badness = Math.max(sMid.badness, area);
      }
    }
  }

  function addPoint(x: number, y: number): void {
    if (samples.length >= opts.maxPoints) return;

    let ipos = 0;
    while (ipos < samples.length && samples[ipos].x < x) {
      ipos++;
    }

    if (ipos > 0 && x - samples[ipos - 1].x < opts.minDX) return;
    if (ipos < samples.length && samples[ipos].x - x < opts.minDX) return;
    if (ipos < samples.length && samples[ipos].x === x) return; // Exact match

    const newSample: Sample = { x, y, badness: 0 };

    // If ipos > 0, samples[ipos-1] is the point before the new sample.
    // Its badness was for the interval (samples[ipos-1], samples[ipos_original_at_this_index]).
    // This interval is now being split or replaced. So, clear its badness.
    if (ipos > 0) {
      if (samples[ipos - 1].badness > 0) {
        numBadIntervals--;
      }
      samples[ipos - 1].badness = 0;
    }

    samples.splice(ipos, 0, newSample);
    const currentNs = samples.length;

    // Update badness for affected triplets based on C logic:
    if (currentNs < 3) return; // Need at least 3 points for any triplet analysis

    if (ipos === 0) {
      // New point is the first one: s[0]
      // Triplet (s[0]_new, s[1]_orig, s[2]_orig). Middle is s[1]_orig (index 1).
      updateBadnessForTriplet(1);
    } else if (ipos === currentNs - 1) {
      // New point is the last one: s[ns-1]
      // Triplet (s[ns-3]_orig, s[ns-2]_orig, s[ns-1]_new). Middle is s[ns-2]_orig (index currentNs - 2).
      updateBadnessForTriplet(currentNs - 2);
    } else {
      // Internal point: s[ipos] is new
      // Triplet (s[ipos-2]_orig, s[ipos-1]_orig, s[ipos]_new). Middle: s[ipos-1]_orig (index ipos-1)
      // This check (ipos-1 >= 1) ensures s[ipos-2] exists.
      if (ipos - 1 >= 1) updateBadnessForTriplet(ipos - 1);

      // Triplet (s[ipos-1]_orig, s[ipos]_new, s[ipos+1]_orig). Middle: s[ipos]_new (index ipos)
      updateBadnessForTriplet(ipos);

      // Triplet (s[ipos]_new, s[ipos+1]_orig, s[ipos+2]_orig). Middle: s[ipos+1]_orig (index ipos+1)
      // This check (ipos+1 <= currentNs-2) ensures s[ipos+2] exists.
      if (ipos + 1 <= currentNs - 2) updateBadnessForTriplet(ipos + 1);
    }
  }

  if (opts.xMin === opts.xMax) {
    const y = evaluateAndSanitizeY(opts.xMin);
    return [{ x: opts.xMin, y }];
  }

  const initialXValues: number[] = [];
  for (let i = 0; i < opts.initialPoints; i++) {
    const t = i / (opts.initialPoints - 1); // Ensures t=0 for i=0, t=1 for i=opts.initialPoints-1
    initialXValues.push(opts.xMin + t * (opts.xMax - opts.xMin));
  }

  initialXValues.forEach((x) => {
    const y = evaluateAndSanitizeY(x);
    addPoint(x, y);
  });

  let iterations = 0;
  const MAX_ITERATIONS = opts.maxPoints * 3; // Heuristic safety break for iterations

  while (
    numBadIntervals > 0 &&
    samples.length < opts.maxPoints &&
    iterations < MAX_ITERATIONS
  ) {
    const xValuesToRefine: number[] = [];
    for (let i = 0; i < samples.length - 1; i++) {
      if (samples[i].badness > 0) {
        if (samples[i + 1].x - samples[i].x >= 2 * opts.minDX) {
          xValuesToRefine.push((samples[i].x + samples[i + 1].x) / 2);
        } else {
          // Interval is too small to refine further, but still marked bad. Clear its badness.
          if (samples[i].badness > 0) {
            numBadIntervals--;
          }
          samples[i].badness = 0;
        }
      }
    }

    if (xValuesToRefine.length === 0) break;

    xValuesToRefine.sort((a, b) => a - b);

    let addedInThisIterationCount = 0;
    for (const x of xValuesToRefine) {
      if (samples.length >= opts.maxPoints) break;

      // Minimal check for closeness, addPoint has more robust check
      let skip = false;
      for (let k = 0; k < samples.length; ++k) {
        if (Math.abs(samples[k].x - x) < opts.minDX) {
          skip = true;
          break;
        }
      }
      if (skip) continue;

      const y = evaluateAndSanitizeY(x);
      const originalLength = samples.length;
      addPoint(x, y);
      if (samples.length > originalLength) {
        addedInThisIterationCount++;
      }
    }

    if (
      addedInThisIterationCount === 0 &&
      xValuesToRefine.length > 0 &&
      numBadIntervals > 0
    ) {
      // All candidates were too close or other conditions prevented adding.
      // Break to avoid potential infinite loop if numBadIntervals can't be cleared by adding points.
      break;
    }
    iterations++;
  }

  return samples.map(({ x, y }) => ({ x, y }));
}
