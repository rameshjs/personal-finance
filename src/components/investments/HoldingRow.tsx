import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Investment } from '../../types/investment';
import { formatINR, formatQty } from '../../utils/format';

interface Props {
  holding: Investment;
  onDelete: (id: string) => void;
  onEdit: (holding: Investment) => void;
  onSell: (holding: Investment) => void;
}

export default function HoldingRow({ holding, onDelete, onEdit, onSell }: Props) {
  const currentPrice = holding.currentPrice ?? holding.avgBuyPrice;
  const value = holding.quantity * currentPrice;
  const cost = holding.quantity * holding.avgBuyPrice;
  const pnl = value - cost;
  const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
  const isPnLPositive = pnl >= 0;

  const exchangeLabel = holding.exchange === 'NS' ? 'NSE' : 'BSE';
  const subLabel =
    holding.type === 'mf'
      ? `MF · ${holding.ticker}`
      : `${holding.ticker} · ${exchangeLabel}`;

  return (
    <TableRow className="hover:bg-muted/20 transition-colors">
      <TableCell className="px-3 py-2">
        <div className="font-medium">{holding.name}</div>
        <div className="text-muted-foreground text-xs">
          {subLabel}
          {holding.fetchError && (
            <span className="ml-1 text-destructive" title="Price fetch failed">⚠</span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-3 py-2 text-right tabular-nums">{formatQty(holding.quantity)}</TableCell>
      <TableCell className="px-3 py-2 text-right tabular-nums">{formatINR(holding.avgBuyPrice)}</TableCell>
      <TableCell className="px-3 py-2 text-right tabular-nums">
        {holding.currentPrice
          ? formatINR(holding.currentPrice)
          : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="px-3 py-2 text-right tabular-nums font-medium">{formatINR(value)}</TableCell>
      <TableCell className={`px-3 py-2 text-right tabular-nums ${isPnLPositive ? 'text-green-500' : 'text-destructive'}`}>
        <div>{isPnLPositive ? '+' : ''}{formatINR(pnl)}</div>
        <div className="opacity-80">{isPnLPositive ? '+' : ''}{pnlPct.toFixed(2)}%</div>
      </TableCell>
      <TableCell className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(holding)}
            className="text-muted-foreground hover:text-foreground"
            title="Edit"
          >
            ✎
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onSell(holding)}
            className="text-muted-foreground hover:text-amber-500"
            title="Sell"
          >
            ₹
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(holding.id)}
            className="text-muted-foreground hover:text-destructive"
            title="Remove"
          >
            ✕
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
