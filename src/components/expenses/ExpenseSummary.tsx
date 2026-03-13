import { Card, CardContent } from '@/components/ui/card';
import { formatINR } from '../../utils/format';

interface Props {
  totalIncome: number;
  totalExpenses: number;
  net: number;
}

export default function ExpenseSummary({ totalIncome, totalExpenses, net }: Props) {
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
