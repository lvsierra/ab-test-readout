import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/method")({
  head: () => ({
    meta: [
      { title: "Method — A/B Test Readout" },
      {
        name: "description",
        content:
          "The statistics behind A/B Test Readout: two-proportion z-test, confidence intervals, sample size and the sample ratio mismatch check.",
      },
      { property: "og:title", content: "Method — A/B Test Readout" },
      {
        property: "og:description",
        content:
          "The statistics behind A/B Test Readout: two-proportion z-test, confidence intervals, sample size and the sample ratio mismatch check.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/method" }],
  }),
  component: MethodPage,
});

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-soft overflow-x-auto rounded-xl px-4 py-3 font-mono text-[13px] leading-relaxed text-ink">
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display text-base font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-ink">
        {children}
      </div>
    </section>
  );
}

function MethodPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[oklch(0.965_0.008_250)] via-[oklch(0.952_0.01_248)] to-[oklch(0.932_0.014_252)] font-sans text-ink">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 size-[420px] rounded-full bg-white/70 blur-3xl" />
        <div className="absolute top-1/3 -right-24 size-[460px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-[380px] rounded-full bg-white/50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-8 flex items-center justify-between sm:mb-10">
          <Link
            to="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="grid size-9 place-items-center rounded-xl bg-ink text-background">
              <span className="font-display text-sm font-semibold tracking-tight">
                A/B
              </span>
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold tracking-tight">
                A/B Test Readout
              </p>
              <p className="text-xs text-muted-ink">Back to the calculator</p>
            </div>
          </Link>
          <span className="hidden items-center gap-2 rounded-full bg-white/50 px-3 py-1.5 text-xs font-medium text-muted-ink ring-1 ring-black/5 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-primary" />
            Method
          </span>
        </header>

        <main className="glass rounded-[28px] p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Method
          </h1>

          <Section title="What this tool does">
            <p>
              It takes the finished visitor and conversion counts of an A/B
              test and turns them into conversion rates, the difference between
              the variants, a confidence interval and a p-value. It then states
              the result in plain English, and checks that the observed traffic
              split matches what was planned.
            </p>
          </Section>

          <Section title="Formulas">
            <p>
              <strong className="text-ink">Two-proportion z-test.</strong> With
              n<sub>A</sub>, n<sub>B</sub> visitors and c<sub>A</sub>, c
              <sub>B</sub> conversions:
            </p>
            <Formula>
              p̂<sub>A</sub> = c<sub>A</sub> / n<sub>A</sub> &nbsp;·&nbsp; p̂
              <sub>B</sub> = c<sub>B</sub> / n<sub>B</sub>
              <br />
              p̂ = (c<sub>A</sub> + c<sub>B</sub>) / (n<sub>A</sub> + n
              <sub>B</sub>)
              <br />
              SE = √( p̂(1 − p̂) · (1/n<sub>A</sub> + 1/n<sub>B</sub>) )
              <br />
              z = (p̂<sub>B</sub> − p̂<sub>A</sub>) / SE
              <br />p (two-sided) = 2 · (1 − Φ(|z|))
            </Formula>
            <p>
              The pooled proportion p̂ is used for the test itself, following
              the standard practice under the null hypothesis that both
              variants share one rate.
            </p>
            <p>
              <strong className="text-ink">Confidence interval.</strong> For
              the difference in rates, using the unpooled standard error:
            </p>
            <Formula>
              SE<sub>unpooled</sub> = √( p̂<sub>A</sub>(1 − p̂<sub>A</sub>)/n
              <sub>A</sub> + p̂<sub>B</sub>(1 − p̂<sub>B</sub>)/n<sub>B</sub> )
              <br />
              (p̂<sub>B</sub> − p̂<sub>A</sub>) ± z* · SE<sub>unpooled</sub>
              <br />
              z* = Φ⁻¹(1 − (1 − confidence)/2)
            </Formula>
            <p>
              z* comes from the inverse normal CDF for the chosen confidence
              level (1.645 · 2 = 90%, 1.960 · 2 = 95%, 2.576 · 2 = 99%) — it is
              computed, never hard-coded.
            </p>
            <p>
              <strong className="text-ink">Sample size (planning).</strong> For
              a two-sided test with significance α and power 1 − β, testing a
              baseline rate p<sub>0</sub> against an alternative p
              <sub>1</sub>, with Δ = |p<sub>1</sub> − p<sub>0</sub>| and p̄ = (p
              <sub>0</sub> + p<sub>1</sub>)/2, the visitors needed per variant
              are approximately:
            </p>
            <Formula>
              n ≈ ( z<sub>1−α/2</sub> · √(2p̄(1 − p̄)) + z<sub>1−β</sub> · √(p
              <sub>0</sub>(1 − p<sub>0</sub>) + p<sub>1</sub>(1 − p
              <sub>1</sub>)) )² / Δ²
            </Formula>
            <p>
              This is the classic two-proportion formula; the tool does not
              compute it, but it is the rule of thumb behind "you need far more
              visitors than you think" for small effects.
            </p>
            <p>
              <strong className="text-ink">SRM check.</strong> A chi-square
              goodness-of-fit test of the observed visitor counts against the
              planned split (1 degree of freedom). With expected counts E
              <sub>A</sub>, E<sub>B</sub> from the planned split:
            </p>
            <Formula>
              χ² = Σ (O − E)² / E &nbsp;over both variants
              <br />p = 2 · (1 − Φ(√χ²)) &nbsp;(the χ² distribution with 1 df)
            </Formula>
            <p>
              A p-value below 0.001 flags a sample ratio mismatch. Note that an
              unequal split is only a mismatch if it differs from what was
              planned — a deliberately unbalanced 96/4 test is healthy at 96/4.
            </p>
          </Section>

          <Section title="Assumptions">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Each user is assigned randomly and independently to a variant.
              </li>
              <li>One conversion per user — no repeat counting.</li>
              <li>
                The sample size was fixed in advance; you did not stop early
                because the result looked good.
              </li>
              <li>No peeking: the test was not evaluated repeatedly while running.</li>
            </ul>
          </Section>

          <Section title="Limitations">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                The normal approximation behind the z-test needs enough
                conversions in each group — the tool warns when either group
                has fewer than 10 conversions or 10 non-conversions.
              </li>
              <li>
                One metric at a time: analysing several metrics separately
                makes some of them look significant by chance alone.
              </li>
              <li>
                No correction for multiple comparisons is applied, for the same
                reason.
              </li>
            </ul>
          </Section>

          <Section title="Validation">
            <p>
              All calculations were checked against Python (statsmodels /
              SciPy). Verification script in the GitHub repo:{" "}
              <code className="rounded-md bg-white/60 px-1.5 py-0.5 font-mono text-[12px] text-ink ring-1 ring-black/5">
                analysis/verify.py
              </code>
              .
            </p>
          </Section>
        </main>

        <footer className="mt-8 border-t border-line/70 pt-5 text-center text-xs text-faint">
          <p>
            Built by Laura Sierra ·{" "}
            <Link
              to="/"
              className="underline underline-offset-2 hover:text-ink"
            >
              Back to the calculator
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
