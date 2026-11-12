# CovaryLab

A browser-local measurement notebook for student science labs. It checks physical dimensions, tracks **shared error sources**, computes first-order uncertainty with automatic differentiation, and compares that approximation with a reproducible normal-model simulation.


## Run

Download this folder and open `index.html` in a modern browser. No build step, account, dependency, network service or installation is needed. JavaScript must be enabled. To reproduce the engine checks with Node.js:

```sh
node test.cjs
```

`engine.js` is a dependency-free CommonJS/browser module; `app.js` connects it to the editor; `examples.js` contains explicitly fictional teaching fixtures. `style.css` and `index.html` form the interface.

## Why it exists

When two readings share an instrument zero offset, their errors are correlated. Adding independent error bars can hide a cancellation or understate a compounded error. CovaryLab makes that assumption visible and links it to a practical question: which measurement improvement would most reduce the result's uncertainty? A classroom teacher could use the examples to explain measurement models without uploading lab notes.

## Measurement model and methods

Inputs are transformed to SI. Each independent reading error and each shared source is a separate zero-mean latent error with standard deviation one. A source's SI impact vector is its standard uncertainty times its dimensionless weights. Therefore:

`covariance = diagonal(independent_sigma_SI²) + sum(source_impact * source_impact_transpose)`

This construction is positive semidefinite by definition. A source must have the same physical dimensions as every reading it affects. Negative weights represent opposite responses to the same error. Sources are additive, independent of one another, and independent of reading-specific errors; multiplicative calibration needs an explicit different formula/model.

A recursive-descent parser builds an expression tree without `eval` or dynamic code generation. Forward-mode automatic differentiation evaluates sensitivity coefficients. Each latent group's output variance contribution is `(gradient dot impact)²`, scaled to the output unit. Their sum equals `gradientᵀ covariance gradient`. The comparison removes only cross-variable covariances while preserving each reading's marginal variance; repeated occurrences of one variable are always the same reading.

Monte Carlo draws one shared normal sample per source and one independent normal sample per reading for each trial. It uses a seeded Mulberry32-style generator and Box–Muller transform. Rejected domain draws are counted explicitly and never silently resampled. Histograms and quantiles summarize **valid simulated outputs**, not measured observations. With rejected draws, those summaries are conditional and may be misleading if interpreted as the full output distribution.

The improvement exercise halves one source's standard uncertainty, so that group's first-order variance contribution is multiplied by 0.25, with other assumptions fixed. It does not estimate cost or choose an instrument for you.

These are established methods, not a claim of a new uncertainty algorithm. Reference: [NIST, Combining uncertainty components](https://physics.nist.gov/cuu/Uncertainty/combination.html), which describes first-order propagation and covariance terms. All source here is newly implemented; no third-party runtime code or dataset is bundled.

## Units and formulas

Units: `1, m, cm, mm, kg, g, s, ms, min, A, K, mol, cd, Hz, N, J, Pa, W, V, ohm`. Products and quotients use `*` and `/`; integer powers use `^`. Compound units are evaluated left to right. No unit parentheses, implicit multiplication, degree conversion, Celsius/Fahrenheit offsets or arbitrary prefixes.

Formulas support `+ - * / ^`, parentheses, `pi`, `sqrt`, `sin`, `cos`, `exp`, `log`. Exponents must be constant integers from -12 to 12. Square root requires a positive nominal value; zero is rejected because its derivative is singular. Trigonometric, exponential and logarithmic arguments must be dimensionless. Inputs are capped at 12 variables, 12 shared sources and 200 tokens/500 formula characters; simulation is capped at 20,000 draws.

## Reproducibility and privacy

Exported JSON includes input units, source weights, formula, normal-model assumptions, engine version, seed, attempted/accepted/rejected counts, first-order results, covariance and simulation summary. Import reruns the inputs; imported saved results are not trusted. Version 1 imports use the UI draw counts 2,000, 6,000 or 16,000. The numerical API also accepts 100–20,000. Notes stay on the user's device until the user chooses to share them. No telemetry, localStorage, remote fonts or external scripts are used.

## Limits and verification

This is a teaching prototype, not metrology certification or a validated lab instrument. First-order propagation can fail for nonlinear or singular models. Normal errors are a user assumption and may be inappropriate for bounded, skewed, discrete or systematic uncertainties. Quantiles are not automatically confidence intervals. Unknown bias is not discovered by this tool. Monte Carlo is sampling-based; changing the seed changes its numerical estimates. Histogram binning uses the full valid range, so extreme tails can compress the visible distribution.

Twenty runnable checks cover analytic cancellation/compounding, repeated variables, unit conversions, derived units, parser precedence, finite-difference derivatives, hand-derived pendulum sensitivity, covariance positivity and quadratic-form agreement, intervention prediction, malformed/unsafe expressions, singular domains, simulation reproducibility, invalid draws, deterministic uncertainty and exact normal/lognormal moments. Test execution and UI verification are recorded separately in `SUBMISSION.md` only after performed.
