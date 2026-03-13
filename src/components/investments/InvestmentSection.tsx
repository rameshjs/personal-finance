import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import type { Investment, NewInvestment } from '../../types/investment';
import { api } from '../../services/tauri';
import AddHoldingModal from './AddHoldingModal';
import EditHoldingModal from './EditHoldingModal';
import SellHoldingModal from './SellHoldingModal';
import PortfolioSummary from './PortfolioSummary';
import HoldingsTable from './HoldingsTable';

const SYNC_INTERVAL_MS = 60_000;

export default function InvestmentSection() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editHolding, setEditHolding] = useState<Investment | null>(null);
  const [sellHolding, setSellHolding] = useState<Investment | null>(null);

  const {
    data: holdings = [],
    isLoading,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['investments'],
    queryFn: api.syncPrices,
    staleTime: SYNC_INTERVAL_MS,
    refetchInterval: SYNC_INTERVAL_MS,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['investments'] });
    queryClient.invalidateQueries({ queryKey: ['consolidated-report'] });
  };

  const addMutation = useMutation({
    mutationFn: (investment: NewInvestment) => api.addInvestment(investment),
    onSuccess: (data) => {
      queryClient.setQueryData(['investments'], data);
      setIsAddOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteInvestment(id),
    onSuccess: (data) => queryClient.setQueryData(['investments'], data),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, quantity, avg_buy_price }: { id: string; quantity: number; avg_buy_price: number }) =>
      api.updateInvestment(id, quantity, avg_buy_price),
    onSuccess: (data) => {
      queryClient.setQueryData(['investments'], data);
      setEditHolding(null);
    },
  });

  const sellMutation = useMutation({
    mutationFn: (params: Parameters<typeof api.sellInvestment>[0]) => api.sellInvestment(params),
    onSuccess: (data) => {
      queryClient.setQueryData(['investments'], data);
      setSellHolding(null);
      invalidate();
    },
  });

  const isSyncing = isFetching || addMutation.isPending;
  const lastSyncTime = dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-widest text-muted-foreground">INVESTMENTS</h1>
        <div className="flex items-center gap-2">
          {lastSyncTime && (
            <span className="text-xs text-muted-foreground">
              synced {lastSyncTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.refetchQueries({ queryKey: ['investments'] })}
            disabled={isSyncing || holdings.length === 0}
            className="gap-1.5 tracking-widest"
          >
            <span className={isSyncing ? 'animate-spin inline-block' : ''}>↻</span>
            {isSyncing ? 'SYNCING' : 'SYNC'}
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="tracking-widest">
            + ADD
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-8 text-center tracking-widest">LOADING...</div>
      ) : (
        <>
          {holdings.length > 0 && <PortfolioSummary holdings={holdings} />}
          <HoldingsTable
            holdings={holdings}
            onDelete={(id) => deleteMutation.mutate(id)}
            onEdit={(h) => setEditHolding(h)}
            onSell={(h) => setSellHolding(h)}
          />
        </>
      )}

      <AddHoldingModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={(investment) => addMutation.mutate(investment)}
      />

      {editHolding && (
        <EditHoldingModal
          open={!!editHolding}
          onOpenChange={(open) => { if (!open) setEditHolding(null); }}
          holding={editHolding}
          onUpdate={(id, quantity, avg_buy_price) => editMutation.mutate({ id, quantity, avg_buy_price })}
        />
      )}

      {sellHolding && (
        <SellHoldingModal
          open={!!sellHolding}
          onOpenChange={(open) => { if (!open) setSellHolding(null); }}
          holding={sellHolding}
          onSell={(params) => sellMutation.mutate(params)}
        />
      )}
    </div>
  );
}
