import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { OtherInvestment } from '../../types/other-investment';
import {
  calcSavingsValue,
  calcFDValue,
  calcRDValue,
  calcRDInvestedSoFar,
} from '../../types/other-investment';
import { formatINR } from '../../utils/format';

interface Props {
  investment: OtherInvestment;
  onDelete: (id: string) => void;
}

const TYPE_LABELS: Record<string, string> = {
  savings: 'SAVINGS',
  gold: 'GOLD',
  fd: 'FD',
  rd: 'RD',
};

function calcCurrentValue(inv: OtherInvestment): number {
  switch (inv.type) {
    case 'savings':
      return calcSavingsValue(inv.principal, inv.interestRate ?? 0, inv.startDate);
    case 'fd':
      return calcFDValue(
        inv.principal,
        inv.interestRate ?? 0,
        inv.startDate,
        inv.maturityDate,
        inv.compoundingFrequency ?? 4,
      );
    case 'rd':
      return calcRDValue(inv.principal, inv.interestRate ?? 0, inv.startDate, inv.totalMonths ?? 0);
    case 'gold':
      return inv.principal * (inv.currentPrice ?? inv.purchasePricePerUnit ?? 0);
    default:
      return 0;
  }
}

function calcInvested(inv: OtherInvestment): number {
  switch (inv.type) {
    case 'rd':
      return calcRDInvestedSoFar(inv.principal, inv.startDate, inv.totalMonths ?? 0);
    case 'gold':
      return inv.principal * (inv.purchasePricePerUnit ?? 0);
    default:
      return inv.principal;
  }
}

function getSubLabel(inv: OtherInvestment): string {
  switch (inv.type) {
    case 'savings':
    case 'fd':
      return `${inv.interestRate ?? 0}% p.a. · from ${inv.startDate}${inv.maturityDate ? ` · matures ${inv.maturityDate}` : ''}`;
    case 'rd':
      return `${formatINR(inv.principal)}/mo · ${inv.interestRate ?? 0}% p.a. · ${inv.totalMonths ?? 0} months`;
    case 'gold':
      return `${inv.principal}g · bought @ ${formatINR(inv.purchasePricePerUnit ?? 0)}/g`;
    default:
      return '';
  }
}

export default function OtherInvestmentRow({ investment, onDelete }: Props) {
  const invested = calcInvested(investment);
  const currentValue = calcCurrentValue(investment);
  const gain = currentValue - invested;
  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;
  const isPositive = gain >= 0;

  return (
    <TableRow className="hover:bg-muted/20 transition-colors">
      <TableCell className="px-3 py-2">
        <div className="font-medium">{investment.name}</div>
        <div className="text-muted-foreground text-xs">
          {TYPE_LABELS[investment.type] ?? investment.type} · {getSubLabel(investment)}
          {investment.fetchError && (
            <span className="ml-1 text-destructive" title="Price fetch failed">⚠</span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-3 py-2 text-right tabular-nums">{formatINR(invested)}</TableCell>
      <TableCell className="px-3 py-2 text-right tabular-nums">
        {investment.type === 'gold' && !investment.currentPrice ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          formatINR(currentValue)
        )}
      </TableCell>
      <TableCell className={`px-3 py-2 text-right tabular-nums ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
        <div>{isPositive ? '+' : ''}{formatINR(gain)}</div>
        <div className="opacity-80">{isPositive ? '+' : ''}{gainPct.toFixed(2)}%</div>
      </TableCell>
      <TableCell className="px-3 py-2 text-right">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onDelete(investment.id)}
          className="text-muted-foreground hover:text-destructive"
          title="Remove"
        >
          ✕
        </Button>
      </TableCell>
    </TableRow>
  );
}
