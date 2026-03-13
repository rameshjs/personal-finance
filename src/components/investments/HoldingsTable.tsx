import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Investment } from '../../types/investment';
import HoldingRow from './HoldingRow';

interface Props {
  holdings: Investment[];
  onDelete: (id: string) => void;
  onEdit: (holding: Investment) => void;
  onSell: (holding: Investment) => void;
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border text-center py-16 text-muted-foreground">
      <div className="text-2xl mb-2">📈</div>
      <div className="text-xs tracking-widest">NO HOLDINGS YET</div>
      <div className="text-xs mt-1 opacity-60">Click + ADD to track your first stock or mutual fund</div>
    </div>
  );
}

export default function HoldingsTable({ holdings, onDelete, onEdit, onSell }: Props) {
  if (holdings.length === 0) return <EmptyState />;

  return (
    <div className="border border-border overflow-x-auto">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-3 py-2 text-muted-foreground tracking-wider font-normal">NAME</TableHead>
            <TableHead className="px-3 py-2 text-right text-muted-foreground tracking-wider font-normal">QTY</TableHead>
            <TableHead className="px-3 py-2 text-right text-muted-foreground tracking-wider font-normal">AVG</TableHead>
            <TableHead className="px-3 py-2 text-right text-muted-foreground tracking-wider font-normal">CURRENT</TableHead>
            <TableHead className="px-3 py-2 text-right text-muted-foreground tracking-wider font-normal">VALUE</TableHead>
            <TableHead className="px-3 py-2 text-right text-muted-foreground tracking-wider font-normal">P&amp;L</TableHead>
            <TableHead className="px-3 py-2" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding) => (
            <HoldingRow
              key={holding.id}
              holding={holding}
              onDelete={onDelete}
              onEdit={onEdit}
              onSell={onSell}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
