# CovaryLab â€” STEMergent preparation

Status: **local implementation prepared; not published, not entered as a draft, not submitted**.

Pathway: Hackathon. Sole entrant: Vivaan Kandhari.

Build started 31 October 2026 after 17:13 HKT. The later platform opening was 31 October 12:00 HKT, verified against the official schedule. Target the earlier rules closing time, 16 November 09:00 HKT, while the platform says 11:30 HKT. No pre-window project code is reused.

## Tagline

Follow shared measurement errors from student lab readings to units, uncertainty and a better next measurement.

## Story

### Problem and inspiration

Student lab calculations often reduce uncertainty to independent error bars. Two readings from one instrument can share the same error: a zero offset cancels in a difference, but compounds in a sum. CovaryLab makes those assumptions visible in a usable local notebook. The intended users are students and teachers discussing measurement models; no user study or adoption is claimed.

### Working outcome

Enter a formula, readings with units and independent standard uncertainties, and shared additive error sources. The app rejects incompatible dimensions and unsafe or malformed expressions. It computes a covariance-aware result through automatic differentiation, contrasts the distinct-readings independence assumption, and compares the local approximation with seeded normal-model Monte Carlo. A variance budget shows what happens if one uncertainty source is halved. Export/import preserves the model and reproducibility settings.

### Technical implementation and challenge

A dependency-free JavaScript engine combines a recursive-descent expression parser, SI dimension algebra, forward-mode derivatives and latent-source covariance. Shared errors are modeled constructively rather than accepting an arbitrary covariance matrix that could be impossible. Monte Carlo samples each latent source once per trial, and counts invalid domains without replacing rejected draws. Keeping repeated readings, independent assumptions and physical units consistent was the central implementation challenge.

### Honest scope

The underlying mathematics is established; the contribution is this new educational workflow and implementation. All preset inputs are fictional teaching fixtures. First-order results and simulations depend on the supplied model; no experimental validation, new scientific discovery or guaranteed coverage is claimed. Significant AI assistance was used for code, documentation and checks. Vivaan Kandhari is the sole entrant.

## Verification and remaining items

- Engine checks: executed node test.cjs on 31 October 2026; all 20 analytical/reference/regression checks passed.
- Interactive UI checked 9 November through restored supported IAB: ruler difference and sum, pendulum result, incompatible output-unit rejection, JSON export and re-import with matching seed/result. Screenshot saved. Mobile layout and curved-response preset browser checks remain pending.
- Public repository and clean live URL: not published.
- Demo video: pending; recommended by the overview, actual entry field requirements uninspected.
- Actual form, pathway field, custom requirements, final agreement and submitted confirmation: pending. Supported IAB restored 9 November; STEMergent project creation triggers a motorcycles CAPTCHA before a draft.
- Reference: https://physics.nist.gov/cuu/Uncertainty/combination.html
- Official rules: https://stemergent-hacks.devpost.com/rules

## Demo sequence

1. Open the ruler example. Read the 14 cm nominal difference and covariance-aware uncertainty. Explain why the shared 0.2 cm offset cancels.
2. Change `b - a` to `b + a`, analyze and show that the same common error now compounds.
3. Load the pendulum example, show cm-to-m conversion and the variance budget. Deliberately request output unit `kg` and show the dimensional rejection, then restore `m/s^2`.
4. Load the curved response; explain why Monte Carlo spread differs from first-order propagation. All inputs are fictional.
5. Export a JSON note, import it and confirm the same seed/model gives the same result. Close by describing limits and intended classroom use.
