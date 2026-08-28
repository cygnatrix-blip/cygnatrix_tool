import type { GstInput, GstResult } from '@/types/finance';
import { assertNumber, round } from './shared';

/**
 * GST calculation.
 *  - exclusive: the entered amount is the base; GST is added on top.
 *      gst = amount · rate / 100 ;  total = amount + gst
 *  - inclusive: the entered amount already contains GST; we back it out.
 *      base = amount · 100 / (100 + rate) ;  gst = amount − base
 *
 * Intra-state supply splits GST into equal CGST + SGST. Inter-state supply is a
 * single IGST at the full rate.
 */
export function calculateGst(input: GstInput): GstResult {
  assertNumber(input.amount, 'Amount', { min: 0, max: 1e12 });
  assertNumber(input.ratePct, 'GST rate', { min: 0, max: 100 });

  let base: number;
  let gst: number;
  let total: number;

  if (input.mode === 'inclusive') {
    base = (input.amount * 100) / (100 + input.ratePct);
    gst = input.amount - base;
    total = input.amount;
  } else {
    base = input.amount;
    gst = (input.amount * input.ratePct) / 100;
    total = input.amount + gst;
  }

  const interState = input.interState ?? false;
  return {
    baseAmount: round(base, 2),
    gstAmount: round(gst, 2),
    cgst: interState ? 0 : round(gst / 2, 2),
    sgst: interState ? 0 : round(gst / 2, 2),
    igst: interState ? round(gst, 2) : 0,
    totalAmount: round(total, 2),
  };
}
