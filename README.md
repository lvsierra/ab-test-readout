# A/B Test Readout

**Live app:** https://screenshot-magic-0668.lovable.app

A small web tool for analysing and planning A/B tests on a conversion metric. It turns raw counts into a readout a product team can act on: effect size, uncertainty, a plain-English verdict, and a check that the experiment itself ran correctly.

## What it does

**Analyse results**
- Conversion rates, absolute difference (pp) and relative lift
- Two-proportion z-test (two-sided) and confidence interval for the difference
- Plain-English verdict that doesn't overclaim ("cannot distinguish" rather than "no difference")
- Sample ratio mismatch (SRM) check against the planned traffic split
- Warning when counts are too small for the normal approximation

**Plan a test**
- Required sample size per variant from baseline rate, minimum detectable effect, α and power
- Estimated test duration from daily traffic

**Method page** with the formulas, assumptions and limitations.

## Real example

The "Load real example" button uses aggregated counts from the public [Marketing A/B Testing dataset (Kaggle)](https://www.kaggle.com/datasets/faviovaz/marketing-ab-testing): users saw either an ad (treatment) or a public service announcement (control).

| Group | Users | Conversions | Rate |
|---|---|---|---|
| Control (PSA) | 23,524 | 420 | 1.79% |
| Treatment (ad) | 564,577 | 14,423 | 2.55% |

**Result:** +0.77 pp (95% CI +0.60 to +0.94 pp), roughly 43% relative lift, p < 0.0001. The split was deliberately 96/4, and the SRM check confirms traffic matched that plan (p ≈ 0.9998).

**Caveats worth stating:** the control group is small, "conversion" says nothing about the value of each conversion, and the control saw a different ad rather than no ad — so this estimates the effect of the ad *versus a PSA*, not versus nothing.

## Validation

Every statistic in the app was checked against Python (statsmodels / SciPy) — see [`analysis/verify.py`](analysis/verify.py). App and script agree on the z-test, confidence interval, SRM check and sample-size formula.

To reproduce:

```bash
pip install -r analysis/requirements.txt
# download marketing_AB.csv from Kaggle into analysis/
python analysis/verify.py
```

The raw CSV is not included in this repo; download it from the Kaggle page above.

## How it was built

The front end was generated with [Lovable](https://lovable.dev) from prompts I wrote. I specified the statistical methods, formulas and sanity checks, and validated the outputs independently in Python. Commits from the Lovable bot list me as co-author.

## Limitations

- One binary metric at a time; no correction for multiple comparisons
- Fixed-horizon test only — no sequential testing, so results should not be checked repeatedly before the planned sample size is reached
- Normal approximation, which is unreliable for very small counts

## Data licence

Dataset: Marketing A/B Testing, Kaggle. CC0: Public Domain

---

Built by Laura Sierra · [LinkedIn](https://www.linkedin.com/in/laura-v-sierra)
