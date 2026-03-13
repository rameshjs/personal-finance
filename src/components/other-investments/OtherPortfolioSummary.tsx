import _ from 'lodash';
import { Card, CardContent } from '@/components/ui/card';
import type { OtherInvestment } from '../../types/other-investment';
import {
  calcSavingsValue,
  calcFDValue,
  calcRDValue,
  calcRDInvestedSoFar,
} from '../../types/other-investment';
import { formatINR } from '../../utils/format';

interface Props {
  investments: OtherInvestment[];
}

function getInvested(inv: OtherInvestment): number {
  switch (inv.type) {
    case 'rd':
      return calcRDInvestedSoFar(inv.principal, inv.startDate, inv.totalMonths ?? 0);
    case 'gold':
      return inv.principal * (inv.purchasePricePerUnit ?? 0);
    default:
      return inv.principal;
  }
}

function getCurrentValue(inv: OtherInvestment): number {
  switch (inv.type) {
    case 'savings':
      return calcSavingsValue(inv.principal, inv.interestRate ?? 0, inv.startDate);
    case 'fd':
      return calcFDValue(inv.principal, inv.interestRate ?? 0, inv.startDate, inv.maturityDate, inv.compoundingFrequency ?? 4);
    case 'rd':
      return calcRDValue(inv.principal, inv.interestRate ?? 0, inv.startDate, inv.totalMonths ?? 0);
    case 'gold':
      return inv.principal * (inv.currentPrice ?? inv.purchasePricePerUnit ?? 0);
    default:
      return 0;
  }
}

export default function OtherPortfolioSummary({ investments }: Props) {
  const totalInvested = _.sumBy(investments, getInvested);
  const totalValue = _.sumBy(investments, getCurrentValue);
  const totalGain = totalValue - totalInvested;
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const isPositive = totalGain >= 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="rounded-none border-border">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">TOTAL VALUE</p>
          <p className="text-base font-semibold">{formatINR(totalValue)}</p>
        </CardContent>
      </Card>

      <Card className="rounded-none border-border">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">INVESTED</p>
          <p className="text-base font-semibold">{formatINR(totalInvested)}</p>
        </CardContent>
      </Card>

      <Card className="rounded-none border-border">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">GAIN</p>
          <p className={`text-base font-semibold ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}{formatINR(totalGain)}
            <span className="text-xs ml-1 opacity-80">
              ({isPositive ? '+' : ''}{totalGainPct.toFixed(2)}%)
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
