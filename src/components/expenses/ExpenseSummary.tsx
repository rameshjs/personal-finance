import { Card, CardContent } from '@/components/ui/card';
import { formatINR } from '../../utils/format';
import type { Transaction } from '../../types/expense';

interface Props {
  transactions: Transaction[];
}

export default function ExpenseSummary({ transactions }: Props) {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const net = totalIncome - totalExpenses;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="rounded-none border-border">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">INCOME</p>
          <p className="text-base font-semibold text-green-500">{formatINR(totalIncome)}</p>
        </CardContent>
      </Card>
      <Card className="rounded-none border-border">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">EXPENSES</p>
          <p className="text-base font-semibold text-red-500">{formatINR(totalExpenses)}</p>
        </CardContent>
      </Card>
      <Card className="rounded-none border-border">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground tracking-widest mb-1">NET</p>
          <p className={`text-base font-semibold ${net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatINR(net)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
