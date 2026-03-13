import moment from 'moment';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatINR } from '../../utils/format';
import type { Transaction } from '../../types/expense';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function TransactionTable({ transactions, onDelete }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="border border-dashed border-border py-12 text-center">
        <p className="text-xs text-muted-foreground tracking-widest">NO TRANSACTIONS THIS MONTH</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs tracking-widest text-muted-foreground font-medium w-28">DATE</TableHead>
            <TableHead className="text-xs tracking-widest text-muted-foreground font-medium w-36">CATEGORY</TableHead>
            <TableHead className="text-xs tracking-widest text-muted-foreground font-medium">DESCRIPTION</TableHead>
            <TableHead className="text-xs tracking-widest text-muted-foreground font-medium text-right w-36">AMOUNT</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id} className="hover:bg-muted/20 group">
              <TableCell className="text-xs text-muted-foreground py-2.5">
                {formatDate(t.date)}
              </TableCell>
              <TableCell className="py-2.5">
                <span className={`text-xs px-1.5 py-0.5 tracking-wide ${
                  t.type === 'income'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-red-500/10 text-red-600'
                }`}>
                  {t.categoryName}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground py-2.5">
                {t.description || '—'}
              </TableCell>
              <TableCell className={`text-xs font-mono text-right py-2.5 ${
                t.type === 'income' ? 'text-green-500' : 'text-red-500'
              }`}>
                {t.type === 'income' ? '+' : '-'} {formatINR(t.amount)}
              </TableCell>
              <TableCell className="py-2.5 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(t.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return moment(dateStr, 'YYYY-MM-DD').format('DD MMM');
}
