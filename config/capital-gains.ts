/**
 * Indian capital gains tax rules in one dated place, mirroring the pattern in
 * india-payroll.ts. Rates reflect the Union Budget 2024 changes effective
 * 23 July 2024. When the law changes, edit this file only.
 *
 * These are simplified, widely-used conventions for an estimate — NOT a
 * substitute for a CA's advice.
 */
export const CAPITAL_GAINS_CONFIG = {
  asOf: 'Post 23 July 2024 (Budget 2024)',

  /** Listed equity shares and equity-oriented mutual funds (STT paid). */
  equity: {
    longTermMinHoldingMonths: 12,
    ltcgRatePct: 12.5,
    /** Annual exemption on equity LTCG gains. */
    ltcgExemptionAnnual: 125000,
    stcgRatePct: 20,
  },

  /** Everything else: debt funds, gold, real estate, unlisted shares, etc. */
  other: {
    longTermMinHoldingMonths: 24,
    ltcgRatePct: 12.5,
    ltcgExemptionAnnual: 0,
    /** STCG on these assets is added to income and taxed at the person's slab rate. */
    stcgNote: "Short-term gains on this asset class are added to your income and taxed at your income tax slab rate — not a flat percentage. Use the Income Tax Calculator with this gain included in your income to estimate it.",
  },
} as const;
