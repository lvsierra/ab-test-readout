import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  analyzeAbTest,
  srmCheck,
  verdictText,
  type AbResult,
  type SrmResult,
} from "@/lib/stats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A/B Test Readout — conversion significance calculator" },
      {
        name: "description",
        content:
          "Analyse a finished A/B test on a conversion metric: rates, lift, confidence interval, p-value and a plain-English verdict, all in your browser.",
      },
      { property: "og:title", content: "A/B Test Readout" },
      {
        property: "og:description",
        content:
          "Two-proportion z-test with confidence intervals and a plain-English verdict for your finished A/B test.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CONFIDENCE_LEVELS = [0.9, 0.95, 0.99] as const;

type FieldKey = "visitorsA" | "conversionsA" | "visitorsB" | "conversionsB";

type Fields = Record<FieldKey, string>;

const INITIAL: Fields = {
  visitorsA: "1000",
  conversionsA: "100",
  visitorsB: "1000",
  conversionsB: "130",
};

function parseCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isSafeInteger(n) ? n : null;
}

function pct(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

function pp(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  const v = value * 100;
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(decimals)}pp`;
}

function formatPValue(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.0001) return "< 0.0001";
  return p.toFixed(4);
}

function signedPct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const v = value * 100;
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;
}

const EXAMPLE: Fields = {
  visitorsA: "23524",
  conversionsA: "420",
  visitorsB: "564577",
  conversionsB: "14423",
};

function Index() {
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [confidence, setConfidence] = useState<number>(0.95);
  const [splitB, setSplitB] = useState("50");
  const [exampleLoaded, setExampleLoaded] = useState(false);

  const loadExample = () => {
    setFields(EXAMPLE);
    setSplitB("96");
    setExampleLoaded(true);
  };

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    for (const key of Object.keys(fields) as FieldKey[]) {
      const value = parseCount(fields[key]);
      if (value === null) {
        e[key] = "Enter a whole number (0 or more).";
      }
    }
    const nA = parseCount(fields.visitorsA);
    const nB = parseCount(fields.visitorsB);
    const cA = parseCount(fields.conversionsA);
    const cB = parseCount(fields.conversionsB);
    if (nA !== null && nA < 1) e.visitorsA = "Visitors must be at least 1.";
    if (nB !== null && nB < 1) e.visitorsB = "Visitors must be at least 1.";
    if (nA !== null && cA !== null && cA > nA)
      e.conversionsA = "Conversions can't exceed visitors in Variant A.";
    if (nB !== null && cB !== null && cB > nB)
      e.conversionsB = "Conversions can't exceed visitors in Variant B.";
    return e;
  }, [fields]);

  const errorList = (Object.keys(errors) as FieldKey[]).map((k) => errors[k]!);

  const result: AbResult | null = useMemo(() => {
    if (errorList.length > 0) return null;
    const nA = parseCount(fields.visitorsA)!;
    const nB = parseCount(fields.visitorsB)!;
    const cA = parseCount(fields.conversionsA)!;
    const cB = parseCount(fields.conversionsB)!;
    return analyzeAbTest(
      { visitors: nA, conversions: cA },
      { visitors: nB, conversions: cB },
      confidence,
    );
  }, [fields, confidence, errorList.length]);

  const splitBValue = parseCount(splitB);
  const splitError =
    splitBValue === null || splitBValue < 1 || splitBValue > 99
      ? "Enter a whole number between 1 and 99."
      : null;

  const srm: SrmResult | null = useMemo(() => {
    if (errorList.length > 0 || splitError) return null;
    return srmCheck(
      parseCount(fields.visitorsA)!,
      parseCount(fields.visitorsB)!,
      splitBValue! / 100,
    );
  }, [fields, splitBValue, splitError, errorList.length]);

  const level = `${Math.round(confidence * 100)}%`;

  const set = (key: FieldKey) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[oklch(0.965_0.008_250)] via-[oklch(0.952_0.01_248)] to-[oklch(0.932_0.014_252)] font-sans text-ink">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 size-[420px] rounded-full bg-white/70 blur-3xl" />
        <div className="absolute top-1/3 -right-24 size-[460px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-[380px] rounded-full bg-white/50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-8 flex items-center justify-between sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-ink text-background">
              <span className="font-display text-sm font-semibold tracking-tight">
                A/B
              </span>
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold tracking-tight">
                A/B Test Readout
              </p>
              <p className="text-xs text-muted-ink">
                Conversion significance calculator
              </p>
            </div>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-white/50 px-3 py-1.5 text-xs font-medium text-muted-ink ring-1 ring-black/5 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-primary" />
            Method page coming soon
          </span>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          {/* INPUTS */}
          <section className="glass rounded-[28px] p-6 sm:p-7 lg:col-span-5">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Inputs
              </h2>
              <span className="text-xs text-faint">Control vs treatment</span>
            </div>

            <button
              type="button"
              onClick={loadExample}
              className="mb-4 w-full rounded-xl bg-white/60 px-3 py-2 text-sm font-medium text-ink ring-1 ring-black/5 transition-colors hover:bg-white/80"
            >
              Load real example
            </button>
            {exampleLoaded && (
              <p className="-mt-2 mb-4 text-[11px] leading-relaxed text-faint">
                Source:{" "}
                <a
                  href="https://www.kaggle.com/datasets/faviovaz/marketing-ab-testing"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-ink"
                >
                  Marketing A/B Testing dataset (Kaggle)
                </a>
                . Aggregated counts — real public data.
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <VariantFields
                title="Variant A"
                dotClass="bg-faint"
                visitors={fields.visitorsA}
                conversions={fields.conversionsA}
                visitorsError={errors.visitorsA}
                conversionsError={errors.conversionsA}
                onVisitors={set("visitorsA")}
                onConversions={set("conversionsA")}
              />
              <VariantFields
                title="Variant B"
                dotClass="bg-primary"
                visitors={fields.visitorsB}
                conversions={fields.conversionsB}
                visitorsError={errors.visitorsB}
                conversionsError={errors.conversionsB}
                onVisitors={set("visitorsB")}
                onConversions={set("conversionsB")}
              />
            </div>

            <div className="mt-5">
              <NumberField
                label="Planned traffic split for B (%)"
                value={splitB}
                error={splitError ?? undefined}
                onChange={(v) => {
                  setSplitB(v);
                  setExampleLoaded(false);
                }}
              />
              {exampleLoaded && (
                <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
                  This test was deliberately unbalanced (96/4), so an unequal
                  split alone is not an SRM.
                </p>
              )}
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-medium text-muted-ink">
                Confidence level
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/50 p-1 ring-1 ring-black/5">
                {CONFIDENCE_LEVELS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConfidence(c)}
                    aria-pressed={confidence === c}
                    className={
                      confidence === c
                        ? "rounded-lg bg-ink py-2 text-sm font-medium text-background"
                        : "rounded-lg py-2 text-sm font-medium text-muted-ink transition-colors hover:text-ink"
                    }
                  >
                    {Math.round(c * 100)}%
                  </button>
                ))}
              </div>
            </div>

            {errorList.length > 0 && (
              <div className="mt-5 rounded-xl bg-destructive/8 px-3.5 py-3 ring-1 ring-destructive/20">
                <p className="text-xs font-medium text-destructive">
                  {errorList[0]}
                </p>
                <p className="mt-0.5 text-xs text-muted-ink">
                  Fix the highlighted field to see the readout.
                </p>
              </div>
            )}
          </section>

          {/* RESULTS */}
          <section className="glass rounded-[28px] p-6 sm:p-7 lg:col-span-7">
            {result ? (
              <>
                {srm &&
                  (srm.mismatch ? (
                    <div className="mb-4 rounded-xl bg-destructive/8 px-3.5 py-3 ring-1 ring-destructive/20">
                      <p className="text-xs font-medium text-destructive">
                        Sample ratio mismatch detected — the traffic split
                        differs from the plan. Investigate assignment before
                        trusting these results.
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 ring-1 ring-primary/20">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span className="text-xs font-medium text-primary">
                        Traffic split looks healthy
                      </span>
                    </div>
                  ))}
                <div
                  className={`mb-6 rounded-2xl p-5 ring-1 ${
                    result.significant
                      ? "bg-primary/8 ring-primary/15"
                      : "bg-white/40 ring-black/5"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                        result.significant
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-ink text-background"
                      }`}
                    >
                      {result.significant ? "Significant" : "Inconclusive"}
                    </span>
                    <span className="text-xs text-muted-ink">
                      two-sided, {level} confidence
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold leading-tight tracking-tight text-balance sm:text-2xl">
                    {verdictText(result)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat label="Rate A" value={pct(result.rateA)} />
                  <Stat label="Rate B" value={pct(result.rateB)} accent />
                  <Stat label="Abs. diff" value={pp(result.absoluteDiff)} />
                  <Stat label="Rel. lift" value={signedPct(result.relativeLift)} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="glass-soft rounded-2xl p-4">
                    <p className="text-xs font-medium text-muted-ink">
                      {level} confidence interval (B − A)
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold tracking-tight">
                      {pp(result.ciLower)} to {pp(result.ciUpper)}
                    </p>
                  </div>
                  <div className="glass-soft rounded-2xl p-4">
                    <p className="text-xs font-medium text-muted-ink">
                      Two-sided p-value
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold tracking-tight">
                      {formatPValue(result.pValue)}
                    </p>
                  </div>
                </div>

                {result.lowCountWarning && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-warn/70 px-3.5 py-3 ring-1 ring-warn-foreground/20">
                    <span className="mt-0.5 shrink-0 text-warn-foreground">
                      <svg
                        className="size-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                      </svg>
                    </span>
                    <p className="text-xs leading-relaxed text-warn-foreground">
                      A group has fewer than 10 conversions or 10
                      non-conversions, so the normal approximation behind these
                      numbers may be unreliable.
                    </p>
                  </div>
                )}

                <RateChart result={result} level={level} />
              </>
            ) : (
              <div className="flex h-full min-h-60 items-center justify-center text-center">
                <p className="max-w-xs text-sm text-muted-ink">
                  Enter valid visitor and conversion counts to see the readout.
                </p>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-8 border-t border-line/70 pt-5 text-center text-xs text-faint">
          <p>
            Built by Laura Sierra · Statistical method explained on the Method
            page (coming soon)
          </p>
        </footer>
      </div>
    </div>
  );
}

function VariantFields({
  title,
  dotClass,
  visitors,
  conversions,
  visitorsError,
  conversionsError,
  onVisitors,
  onConversions,
}: {
  title: string;
  dotClass: string;
  visitors: string;
  conversions: string;
  visitorsError?: string | undefined;
  conversionsError?: string | undefined;
  onVisitors: (v: string) => void;
  onConversions: (v: string) => void;
}) {
  return (
    <div className="glass-soft rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`size-2 rounded-full ${dotClass}`} />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-ink">
          {title}
        </span>
      </div>
      <NumberField
        label="Visitors"
        value={visitors}
        error={visitorsError}
        onChange={onVisitors}
      />
      <div className="mt-3">
        <NumberField
          label="Conversions"
          value={conversions}
          error={conversionsError}
          onChange={onConversions}
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-ink">
        {label}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl bg-white/70 px-3 py-2 text-sm font-medium text-ink tabular-nums outline-none ring-1 focus:ring-2 ${
          error
            ? "ring-destructive/50 focus:ring-destructive/50"
            : "ring-black/5 focus:ring-primary/40"
        }`}
      />
      {error && (
        <p className="mt-1 text-[11px] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="glass-soft rounded-2xl p-4">
      <p className="text-xs font-medium text-muted-ink">{label}</p>
      <p
        className={`mt-1 font-display text-2xl font-semibold tracking-tight tabular-nums ${
          accent ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RateChart({ result, level }: { result: AbResult; level: string }) {
  const top = Math.max(
    result.ciA[1],
    result.ciB[1],
    result.rateA,
    result.rateB,
    0.0001,
  );
  const scale = (v: number) => `${Math.min(100, Math.max(0, (v / top) * 100))}%`;

  const bars = [
    {
      key: "A",
      rate: result.rateA,
      ci: result.ciA,
      bar: "bg-faint/70",
      line: "bg-faint",
      text: "text-muted-ink",
    },
    {
      key: "B",
      rate: result.rateB,
      ci: result.ciB,
      bar: "bg-primary",
      line: "bg-primary",
      text: "text-primary",
    },
  ];

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-ink">
          Conversion rate with {level} CI
        </p>
        <p className="text-[11px] text-faint">bars = rate · whiskers = CI</p>
      </div>
      <div className="glass-soft rounded-2xl p-5">
        <div className="relative flex h-40 items-end gap-8 px-2">
          <div className="absolute inset-x-0 top-0 h-px bg-line/70" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-line/70" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-line" />
          {bars.map((b) => (
            <div
              key={b.key}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="relative flex h-full w-full justify-center">
                <div
                  className={`absolute w-px ${b.line}`}
                  style={{
                    bottom: scale(Math.max(0, b.ci[0])),
                    height: `calc(${scale(b.ci[1])} - ${scale(Math.max(0, b.ci[0]))})`,
                  }}
                />
                <div
                  className={`absolute h-px w-4 ${b.line}`}
                  style={{ bottom: scale(Math.max(0, b.ci[0])) }}
                />
                <div
                  className={`absolute h-px w-4 ${b.line}`}
                  style={{ bottom: scale(b.ci[1]) }}
                />
                <div
                  className={`absolute bottom-0 w-10 rounded-t-md ${b.bar}`}
                  style={{ height: scale(b.rate) }}
                />
              </div>
              <span className={`mt-2 text-xs font-medium ${b.text}`}>
                {b.key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
