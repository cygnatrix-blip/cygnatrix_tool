import type { CapitalGainsInput, CapitalGainsResult } from '@/types/finance';
import { CAPITAL_GAINS_CONFIG } from '@/config/capital-gains';
import { assertNumber, round } from './shared';

/**
 * Classify a sale as long- or short-term based on the asset class's holding
 * threshold, then apply the matching rate. Short-term gains on non-equity
 * assets depend on the seller's income slab, which this calculator doesn't
 * know — that case reports `tax: null` with an explanatory note instead of
 * guessing a number.
 */
export function calculateCapitalGains(input: CapitalGainsInput): CapitalGainsResult {
  assertNumber(input.purchaseValue, 'Purchase value', { min: 0, max: 1e12 });
  assertNumber(input.saleValue, 'Sale value', { min: 0, max: 1e12 });
  assertNumber(input.holdingMonths, 'Holding period', { min: 0, max: 1200 });
  if (input.assetClass !== 'equity' && input.assetClass !== 'other') {
    throw new Error('Asset class must be "equity" or "other".');
  }

  const gain = round(input.saleValue - input.purchaseValue, 2);
  const positiveGain = Math.max(0, gain);

  if (input.assetClass === 'equity') {
    const cfg = CAPITAL_GAINS_CONFIG.equity;
    const isLongTerm = input.holdingMonths >= cfg.longTermMinHoldingMonths;
    if (isLongTerm) {
      const exemptionApplied = Math.min(positiveGain, cfg.ltcgExemptionAnnual);
      const taxableGain = round(positiveGain - exemptionApplied, 2);
      return {
        assetClass: 'equity',
        gain,
        isLongTerm,
        exemptionApplied: round(exemptionApplied, 2),
        taxableGain,
        tax: round((taxableGain * cfg.ltcgRatePct) / 100, 2),
        ratePct: cfg.ltcgRatePct,
        note: null,
      };
    }
    return {
      assetClass: 'equity',
      gain,
      isLongTerm,
      exemptionApplied: 0,
      taxableGain: round(positiveGain, 2),
      tax: round((positiveGain * cfg.stcgRatePct) / 100, 2),
      ratePct: cfg.stcgRatePct,
      note: null,
    };
  }

  const cfg = CAPITAL_GAINS_CONFIG.other;
  const isLongTerm = input.holdingMonths >= cfg.longTermMinHoldingMonths;

  if (isLongTerm) {
    return {
      assetClass: 'other',
      gain,
      isLongTerm,
      exemptionApplied: 0,
      taxableGain: round(positiveGain, 2),
      tax: round((positiveGain * cfg.ltcgRatePct) / 100, 2),
      ratePct: cfg.ltcgRatePct,
      note: null,
    };
  }

  return {
    assetClass: 'other',
    gain,
    isLongTerm,
    exemptionApplied: 0,
    taxableGain: round(positiveGain, 2),
    tax: null,
    ratePct: null,
    note: cfg.stcgNote,
  };
}
