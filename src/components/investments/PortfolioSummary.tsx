import _ from 'lodash';
import { Card, CardContent } from '@/components/ui/card';
import type { Investment } from '../../types/investment';
import { formatINR } from '../../utils/format';

interface Props {
  holdings: Investment[];
}

export default function PortfolioSummary({ holdings }: Props) {
  const totalCost = _.sumBy(holdings, (h) => h.quantity * h.avgBuyPrice);
  const totalValue = _.sumBy(holdings, (h) => h.quantity * (h.currentPrice ?? h.avgBuyPrice));
  const totalPnL = totalValue - totalCost;
  const totalPnLPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const isPnLPositive = totalPnL >= 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="rounded-none border-border">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">PORTFOLIO VALUE</p>
          <p className="text-base font-semibold">{formatINR(totalValue)}</p>
        </CardContent>
      </Card>

      <Card className="rounded-none border-border">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">INVESTED</p>
          <p className="text-base font-semibold">{formatINR(totalCost)}</p>
        </CardContent>
      </Card>

      <Card className="rounded-none border-border">
        <CardContent className="p-3">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">P&amp;L</p>
          <p className={`text-base font-semibold ${isPnLPositive ? 'text-green-500' : 'text-destructive'}`}>
            {isPnLPositive ? '+' : ''}{formatINR(totalPnL)}
            <span className="text-xs ml-1 opacity-80">
              ({isPnLPositive ? '+' : ''}{totalPnLPct.toFixed(2)}%)
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
