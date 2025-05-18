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

  const initialPoints = Math.max(
    2,
    userOptions.initialPoints ?? DEFAULT_INITIAL_POINTS
  );

  return {
    xMin,
    xMax,
    minDX: Math.max(DBL_EPSILON, userOptions.minDX ?? DEFAULT_MIN_DX),
    minDYAbs: Math.max(0, userOptions.minDYAbs ?? DEFAULT_MIN_DY_ABS),
    minDYRel: Math.max(0, userOptions.minDYRel ?? DEFAULT_MIN_DY_REL),
    maxCurvature: Math.max(
      DBL_EPSILON,
      Math.min(1, userOptions.maxCurvature ?? DEFAULT_MAX_CURVATURE)
    ),
    initialPoints: initialPoints,
    maxPoints: Math.max(
      initialPoints,
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
  let yMinOverall = Number.POSITIVE_INFINITY;
  let yMaxOverall = Number.NEGATIVE_INFINITY;

  function evaluateAndSanitizeY(x: number): number {
    let yValue: number | undefined | null;
    try {
      yValue = func(x);
    } catch (e) {
      throw e;
    }

    if (yValue === undefined || yValue === null || Number.isNaN(yValue)) {
      return NaN;
    }

    if (Number.isFinite(yValue)) {
      yMinOverall = Math.min(yMinOverall, yValue);
      yMaxOverall = Math.max(yMaxOverall, yValue);
    }
    return yValue;
  }

  function updateBadnessForTriplet(middlePointIndex: number): void {
    if (middlePointIndex <= 0 || middlePointIndex >= samples.length - 1) {
      return;
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

    const isYPNaN = Number.isNaN(yp);
    const isY0NaN = Number.isNaN(y0);
    const isYNNaN = Number.isNaN(yn);

    if (isYPNaN || isY0NaN || isYNNaN) {
      // Interval (sPrev, sMid) - badness on sPrev
      if ((isYPNaN || isY0NaN) && sPrev.badness > 0) {
        sPrev.badness = 0;
        numBadIntervals--;
      }
      // Interval (sMid, sNext) - badness on sMid
      if ((isY0NaN || isYNNaN) && sMid.badness > 0) {
        sMid.badness = 0;
        numBadIntervals--;
      }
      return;
    }

    const isYPFinite = Number.isFinite(yp);
    const isY0Finite = Number.isFinite(y0);
    const isYNFinite = Number.isFinite(yn);
    const numFiniteYs =
      (isYPFinite ? 1 : 0) + (isY0Finite ? 1 : 0) + (isYNFinite ? 1 : 0);

    if (numFiniteYs < 3) {
      // At least one Infinity is present -> asymptote
      const asymptoteBadness = 1e12;

      // Interval (sPrev, sMid) - badness on sPrev
      if (x0 - xp > opts.minDX) {
        if (isYPFinite !== isY0Finite) {
          if (sPrev.badness <= 0 && asymptoteBadness > 0) numBadIntervals++;
          // Badness should only increase or be set if it was zero
          if (asymptoteBadness > sPrev.badness)
            sPrev.badness = asymptoteBadness;
        }
      }

      // Interval (sMid, sNext) - badness on sMid
      if (xn - x0 > opts.minDX) {
        if (isY0Finite !== isYNFinite) {
          if (sMid.badness <= 0 && asymptoteBadness > 0) numBadIntervals++;
          if (asymptoteBadness > sMid.badness) sMid.badness = asymptoteBadness;
        }
      }
      return;
    }

    // All yp, y0, yn are FINITE numbers. Proceed with curvature logic.
    if (
      Math.abs(y0 - yp) < opts.minDYAbs &&
      Math.abs(yn - y0) < opts.minDYAbs
    ) {
      return;
    }

    const yRangeOverall = yMaxOverall - yMinOverall;
    if (yRangeOverall > DBL_EPSILON) {
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

    if (localYRange < DBL_EPSILON) return;

    const totalXRangeTriplet = xn - xp;
    if (totalXRangeTriplet < DBL_EPSILON) return;

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
      return;
    }

    const il0_norm = 1.0 / Math.sqrt(len0_norm_sq);
    const il1_norm = 1.0 / Math.sqrt(len1_norm_sq);
    const sinq =
      (dx0_norm * dy1_norm - dy0_norm * dx1_norm) * il0_norm * il1_norm;

    if (Math.abs(sinq) > opts.maxCurvature) {
      const adx0 = x0 - xp;
      const adx1 = xn - x0;
      const ady0 = y0 - yp;
      const ady1 = yn - y0;
      const newCalculatedBadness = Math.abs(adx0 * ady1 - adx1 * ady0);

      // Interval (sPrev, sMid) - badness on sPrev
      if (adx0 > opts.minDX) {
        if (sPrev.badness <= 0 && newCalculatedBadness > 0) {
          numBadIntervals++;
        }
        if (newCalculatedBadness > sPrev.badness) {
          sPrev.badness = newCalculatedBadness;
        }
      }
      // Interval (sMid, sNext) - badness on sMid
      if (adx1 > opts.minDX) {
        if (sMid.badness <= 0 && newCalculatedBadness > 0) {
          numBadIntervals++;
        }
        if (newCalculatedBadness > sMid.badness) {
          sMid.badness = newCalculatedBadness;
        }
      }
    }
    // Else (low curvature): Do nothing. Badness was reset by addPoint if this interval was part of a split.
  }

  function addPoint(x: number, y: number): void {
    if (samples.length >= opts.maxPoints) return;

    let ipos = 0;
    while (ipos < samples.length && samples[ipos].x < x) {
      ipos++;
    }

    // Check for proximity / duplication
    if (ipos > 0 && x - samples[ipos - 1].x < opts.minDX) return;
    if (ipos < samples.length && samples[ipos].x - x < opts.minDX) return;
    if (ipos < samples.length && samples[ipos].x === x) return;

    const newSample: Sample = { x, y, badness: 0 };

    // If the new point is inserted *between* existing points s[ipos-1] and s[ipos_original],
    // the interval (s[ipos-1], s[ipos_original]) is being split.
    // The badness for this original interval was stored in samples[ipos-1].badness.
    // Clear this badness as the interval is changing.
    if (ipos > 0 && ipos <= samples.length) {
      // Make sure samples[ipos-1] is valid
      // More precise: if ipos refers to the position *before* an existing sample,
      // then samples[ipos-1] is the point *before* our new point.
      // Its badness related to the interval (samples[ipos-1], samples[ipos_original_at_this_index]).
      // This applies if we're not inserting at the very beginning.
      if (samples[ipos - 1] && samples[ipos - 1].badness > 0) {
        numBadIntervals--;
      }
      if (samples[ipos - 1]) samples[ipos - 1].badness = 0;
    }

    samples.splice(ipos, 0, newSample);
    const currentNs = samples.length;

    if (currentNs < 3) return;

    // Update badness for affected triplets.
    // A new point s[ipos] affects triplets centered at s[ipos-1], s[ipos], and s[ipos+1].
    // (Indices are relative to the *newly modified* samples array)
    if (ipos > 0) updateBadnessForTriplet(ipos - 1); // Triplet: (s[ipos-2], s[ipos-1], s[ipos]_new)
    updateBadnessForTriplet(ipos); // Triplet: (s[ipos-1], s[ipos]_new, s[ipos+1])
    if (ipos < currentNs - 1) updateBadnessForTriplet(ipos + 1); // Triplet: (s[ipos]_new, s[ipos+1], s[ipos+2])
  }

  if (opts.xMin === opts.xMax) {
    const y = evaluateAndSanitizeY(opts.xMin);
    return [{ x: opts.xMin, y }];
  }

  const initialXValues: number[] = [];
  for (let i = 0; i < opts.initialPoints; i++) {
    const t = opts.initialPoints === 1 ? 0 : i / (opts.initialPoints - 1);
    initialXValues.push(opts.xMin + t * (opts.xMax - opts.xMin));
  }

  initialXValues.forEach((x) => {
    const y = evaluateAndSanitizeY(x);
    // For initial points, just push them sorted; addPoint's full logic isn't strictly needed here
    // as badness calculations begin after all initial points are in.
    // However, to keep logic consistent for yMin/MaxOverall and maxPoints, use addPoint carefully or replicate.
    // Let's build the initial set first, then compute initial badness.
  });

  // Sort and add initial points directly to avoid complex addPoint interactions during seeding
  const initialSamplesUnsorted: Sample[] = [];
  initialXValues.forEach((x) => {
    const y = evaluateAndSanitizeY(x);
    if (samples.length < opts.maxPoints) {
      // Check maxPoints here too
      initialSamplesUnsorted.push({ x, y, badness: 0 });
    }
  });
  initialSamplesUnsorted.sort((a, b) => a.x - b.x);

  // Filter out duplicates/too close points from initial set
  if (initialSamplesUnsorted.length > 0) {
    samples.push(initialSamplesUnsorted[0]);
    for (let i = 1; i < initialSamplesUnsorted.length; ++i) {
      if (
        initialSamplesUnsorted[i].x - samples[samples.length - 1].x >=
        opts.minDX
      ) {
        if (samples.length < opts.maxPoints) {
          samples.push(initialSamplesUnsorted[i]);
        } else break;
      }
    }
  }

  // Initial badness calculation after all initial points are set
  if (samples.length >= 3) {
    for (let i = 1; i < samples.length - 1; i++) {
      updateBadnessForTriplet(i);
    }
  }

  let iterations = 0;
  // Max iterations can be a multiple of maxPoints or a fixed large number.
  const MAX_ITERATIONS = Math.max(opts.maxPoints, 200) * 5;

  while (
    numBadIntervals > 0 &&
    samples.length < opts.maxPoints &&
    iterations < MAX_ITERATIONS
  ) {
    const xValuesToRefine: number[] = [];
    for (let i = 0; i < samples.length - 1; i++) {
      if (samples[i].badness > 0) {
        if (samples[i + 1].x - samples[i].x >= 2 * opts.minDX) {
          // Ensure interval is splittable
          xValuesToRefine.push((samples[i].x + samples[i + 1].x) / 2);
        } else {
          // Interval is too small to refine further, but still marked bad. Clear its badness.
          if (samples[i].badness > 0) {
            numBadIntervals--;
          } // Should have already been counted
          samples[i].badness = 0;
        }
      }
    }

    if (xValuesToRefine.length === 0 && numBadIntervals > 0) {
      // This might happen if all bad intervals are too small to refine
      // The loop for clearing badness on small intervals above should handle this
      break;
    }
    if (xValuesToRefine.length === 0) break; // No more points to refine

    // Sorting helps addPoint to be slightly more efficient, though addPoint finds correct pos anyway.
    // It also processes refinement from left to right.
    xValuesToRefine.sort((a, b) => a - b);

    let addedInThisIterationCount = 0;
    const uniqueXValuesToRefine = [...new Set(xValuesToRefine)]; // Ensure unique x values

    for (const x of uniqueXValuesToRefine) {
      if (samples.length >= opts.maxPoints) break;

      // addPoint contains its own proximity checks
      const originalLength = samples.length;
      const y = evaluateAndSanitizeY(x);
      addPoint(x, y); // addPoint handles numBadIntervals and badness updates

      if (samples.length > originalLength) {
        addedInThisIterationCount++;
      }
    }

    if (addedInThisIterationCount === 0 && numBadIntervals > 0) {
      // All candidates were too close or other conditions prevented adding new points.
      // If numBadIntervals is still > 0, it implies those bad intervals couldn't be refined.
      break;
    }
    iterations++;
  }

  return samples.map(({ x, y }) => ({ x, y }));
}
