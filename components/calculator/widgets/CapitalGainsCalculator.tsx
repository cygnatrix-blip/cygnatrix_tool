'use client';

import type { AssetClass } from '@/types/finance';
import { calculateCapitalGains } from '@/lib/finance/capital-gains';
import { formatCurrency } from '@/lib/format';
import { CalculatorShell, NumberField, ResultStat, CalcError, SegmentedControl } from '@/components/calculator/shell';
import { useCalc } from '@/lib/hooks/useCalc';
import { useShareableState } from '@/lib/hooks/useShareableState';

export function CapitalGainsCalculator() {
  const [state, setState] = useShareableState({
    assetClass: 'equity' as AssetClass,
    purchaseValue: 100_000,
    saleValue: 200_000,
    holdingMonths: 18,
  });
  const { assetClass, purchaseValue, saleValue, holdingMonths } = state;

  const result = useCalc(
    'capital-gains-calculator',
    () => calculateCapitalGains({ assetClass, purchaseValue, saleValue, holdingMonths }),
    [assetClass, purchaseValue, saleValue, holdingMonths],
    () => ({ assetClass, holdingMonths }),
  );

  return (
    <CalculatorShell
      form={
        <>
          <SegmentedControl
            label="Asset type"
            value={assetClass}
            onChange={(v) => setState({ assetClass: v })}
            options={[
              { value: 'equity', label: 'Listed equity / equity funds' },
              { value: 'other', label: 'Debt funds, gold, property, other' },
            ]}
          />
          <NumberField label="Purchase value" prefix="₹" value={purchaseValue} onChange={(v) => setState({ purchaseValue: v })} min={0} max={100_000_000} step={10_000} slider />
          <NumberField label="Sale value" prefix="₹" value={saleValue} onChange={(v) => setState({ saleValue: v })} min={0} max={100_000_000} step={10_000} slider />
          <NumberField
            label="Holding period"
            suffix="months"
            value={holdingMonths}
            onChange={(v) => setState({ holdingMonths: v })}
            min={0}
            max={600}
            step={1}
            slider
            help={assetClass === 'equity' ? '12+ months counts as long-term for equity.' : '24+ months counts as long-term for this asset class.'}
          />
        </>
      }
      results={
        result.ok ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ResultStat label={result.data.gain >= 0 ? 'Capital gain' : 'Capital loss'} value={formatCurrency(result.data.gain)} emphasis />
              <ResultStat label="Term" value={result.data.isLongTerm ? 'Long-term (LTCG)' : 'Short-term (STCG)'} />
            </div>

            {result.data.tax !== null ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ResultStat label="Exemption applied" value={formatCurrency(result.data.exemptionApplied)} />
                <ResultStat label="Taxable gain" value={formatCurrency(result.data.taxableGain)} />
                <ResultStat label={`Tax @ ${result.data.ratePct}%`} value={formatCurrency(result.data.tax)} emphasis />
              </div>
            ) : (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {result.data.note}
              </div>
            )}
          </>
        ) : (
          <CalcError message={result.error} />
        )
      }
    />
  );
}
