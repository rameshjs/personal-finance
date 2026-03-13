import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OtherInvestment } from '../../types/other-investment';
import OtherInvestmentRow from './OtherInvestmentRow';

interface Props {
  investments: OtherInvestment[];
  onDelete: (id: string) => void;
  onSell: (investment: OtherInvestment) => void;
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border text-center py-16 text-muted-foreground">
      <div className="text-2xl mb-2">🏦</div>
      <div className="text-xs tracking-widest">NO ENTRIES YET</div>
      <div className="text-xs mt-1 opacity-60">Click + ADD to track savings, gold, FD or RD</div>
    </div>
  );
}

export default function OtherInvestmentTable({ investments, onDelete, onSell }: Props) {
  if (investments.length === 0) return <EmptyState />;

  return (
    <div className="border border-border overflow-x-auto">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-3 py-2 text-muted-foreground tracking-wider font-normal">NAME</TableHead>
            <TableHead className="px-3 py-2 text-right text-muted-foreground tracking-wider font-normal">INVESTED</TableHead>
            <TableHead className="px-3 py-2 text-right text-muted-foreground tracking-wider font-normal">CURRENT VALUE</TableHead>
            <TableHead className="px-3 py-2 text-right text-muted-foreground tracking-wider font-normal">GAIN</TableHead>
            <TableHead className="px-3 py-2" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.map((inv) => (
            <OtherInvestmentRow key={inv.id} investment={inv} onDelete={onDelete} onSell={onSell} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
