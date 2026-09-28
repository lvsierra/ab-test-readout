/**
 * Pure statistics helpers for two-proportion A/B test analysis.
 * No UI, no side effects.
 */

/** Standard normal PDF. */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Standard normal CDF Φ(x).
 * Uses Abramowitz & Stegun 7.1.26 style erf approximation
 * (max abs error ~1.5e-7).
 */
export function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/** Error function, Abramowitz & Stegun 7.1.26. */
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/**
 * Inverse standard normal CDF (probit).
 * Acklam's rational approximation refined with one Halley step,
 * accurate to ~1e-15.
 */
export function normalInv(p: number): number {
  if (p <= 0 || p >= 1 || Number.isNaN(p)) return Number.NaN;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let x: number;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x =
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  } else if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    x =
      ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) *
        q) /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x =
      -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }

  // Halley refinement
  const e = normalCdf(x) - p;
  const u = e / normalPdf(x);
  return x - u / (1 + (x * u) / 2);
}

/** Two-sided critical z value for a confidence level such as 0.95. */
export function criticalZ(confidence: number): number {
  return normalInv(1 - (1 - confidence) / 2);
}

export type VariantInput = { visitors: number; conversions: number };

export type AbResult = {
  rateA: number;
  rateB: number;
  /** Absolute difference B - A, as a proportion. */
  absoluteDiff: number;
  /** Relative lift (B - A) / A, as a proportion. NaN when rateA is 0. */
  relativeLift: number;
  /** Pooled standard error used by the z-test. */
  pooledSe: number;
  /** Unpooled standard error used for the confidence interval. */
  unpooledSe: number;
  z: number;
  pValue: number;
  ciLower: number;
  ciUpper: number;
  /** Per-variant CI for its own rate (for error bars on the chart). */
  ciA: [number, number];
  ciB: [number, number];
  significant: boolean;
  lowCountWarning: boolean;
  confidence: number;
  criticalZ: number;
};

/** Two-proportion z-test plus confidence interval for the difference. */
export function analyzeAbTest(
  a: VariantInput,
  b: VariantInput,
  confidence: number,
): AbResult {
  const { visitors: nA, conversions: cA } = a;
  const { visitors: nB, conversions: cB } = b;

  const pA = cA / nA;
  const pB = cB / nB;
  const pPooled = (cA + cB) / (nA + nB);

  const pooledSe = Math.sqrt(pPooled * (1 - pPooled) * (1 / nA + 1 / nB));
  const unpooledSe = Math.sqrt((pA * (1 - pA)) / nA + (pB * (1 - pB)) / nB);

  const z = pooledSe === 0 ? 0 : (pB - pA) / pooledSe;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));

  const zc = criticalZ(confidence);
  const diff = pB - pA;
  const margin = zc * unpooledSe;

  const seA = Math.sqrt((pA * (1 - pA)) / nA);
  const seB = Math.sqrt((pB * (1 - pB)) / nB);

  const lowCountWarning =
    cA < 10 || cB < 10 || nA - cA < 10 || nB - cB < 10;

  return {
    rateA: pA,
    rateB: pB,
    absoluteDiff: diff,
    relativeLift: pA === 0 ? Number.NaN : diff / pA,
    pooledSe,
    unpooledSe,
    z,
    pValue,
    ciLower: diff - margin,
    ciUpper: diff + margin,
    ciA: [pA - zc * seA, pA + zc * seA],
    ciB: [pB - zc * seB, pB + zc * seB],
    significant: pValue < 1 - confidence,
    lowCountWarning,
    confidence,
    criticalZ: zc,
  };
}

/** Plain-English readout of the result. */
export function verdictText(result: AbResult): string {
  const level = `${Math.round(result.confidence * 100)}%`;
  if (!result.significant) {
    return `At the ${level} level, this test cannot distinguish the two variants — the data is consistent with B being better, worse, or the same as A.`;
  }
  const direction = result.absoluteDiff > 0 ? "higher" : "lower";
  return `B's conversion rate is ${direction} than A's, and the difference is statistically significant at the ${level} level.`;
}
