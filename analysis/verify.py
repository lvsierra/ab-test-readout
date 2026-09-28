import pandas as pd
import numpy as np
from pathlib import Path
from scipy.stats import norm, chisquare
from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep

# 1. Real dataset → aggregated counts for the app
df = pd.read_csv(Path(__file__).parent / "marketing_AB.csv")
print(df.columns.tolist())
counts = df.groupby("test group")["converted"].agg(visitors="count", conversions="sum")
print(counts)

# 2. Verify the app's z-test and CI (B = ad, A = psa)
nA, cA = counts.loc["psa", ["visitors", "conversions"]]
nB, cB = counts.loc["ad", ["visitors", "conversions"]]
z, p = proportions_ztest([cB, cA], [nB, nA])
low, high = confint_proportions_2indep(cB, nB, cA, nA, method="wald")
print(f"z={z:.3f}  p={p:.4g}  95% CI diff=[{low*100:.2f}, {high*100:.2f}] pp")

# 3. SRM check against the planned 96/4 split
chi2, p_srm = chisquare([nB, nA], f_exp=[0.96*(nA+nB), 0.04*(nA+nB)])
print(f"SRM chi2={chi2:.2f}  p={p_srm:.4f}")

# 4. Verify the sample-size formula
def n_per_group(p1, mde, alpha=0.05, power=0.8):
    p2 = p1 + mde; pbar = (p1 + p2) / 2
    num = norm.ppf(1-alpha/2)*np.sqrt(2*pbar*(1-pbar)) + norm.ppf(power)*np.sqrt(p1*(1-p1)+p2*(1-p2))
    return int(np.ceil(num**2 / mde**2))
print(n_per_group(0.10, 0.02))  # expected: 3841