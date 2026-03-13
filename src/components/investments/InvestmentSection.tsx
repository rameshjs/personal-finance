import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import type { NewInvestment } from '../../types/investment';
import { api } from '../../services/tauri';
import AddHoldingModal from './AddHoldingModal';
import PortfolioSummary from './PortfolioSummary';
import HoldingsTable from './HoldingsTable';

const SYNC_INTERVAL_MS = 60_000;

export default function InvestmentSection() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const addMutation = useMutation({
    mutationFn: (investment: NewInvestment) => api.addInvestment(investment),
    onSuccess: (data) => {
      queryClient.setQueryData(['investments'], data);
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteInvestment(id),
    onSuccess: (data) => queryClient.setQueryData(['investments'], data),
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
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="tracking-widest">
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
          />
        </>
      )}

      <AddHoldingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAdd={(investment) => addMutation.mutate(investment)}
      />
    </div>
  );
}
