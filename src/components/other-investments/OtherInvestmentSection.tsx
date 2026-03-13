import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import type { NewOtherInvestment, OtherInvestment } from '../../types/other-investment';
import { api } from '../../services/tauri';
import AddOtherInvestmentModal from './AddOtherInvestmentModal';
import SellOtherInvestmentModal from './SellOtherInvestmentModal';
import OtherPortfolioSummary from './OtherPortfolioSummary';
import OtherInvestmentTable from './OtherInvestmentTable';

const SYNC_INTERVAL_MS = 60_000;

export default function OtherInvestmentSection() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sellInvestment, setSellInvestment] = useState<OtherInvestment | null>(null);

  const {
    data: investments = [],
    isLoading,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['other-investments'],
    queryFn: api.syncOtherPrices,
    staleTime: SYNC_INTERVAL_MS,
    refetchInterval: SYNC_INTERVAL_MS,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['other-investments'] });
    queryClient.invalidateQueries({ queryKey: ['consolidated-report'] });
  };

  const addMutation = useMutation({
    mutationFn: (inv: NewOtherInvestment) => api.addOtherInvestment(inv),
    onSuccess: (data) => {
      queryClient.setQueryData(['other-investments'], data);
      setIsAddOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteOtherInvestment(id),
    onSuccess: (data) => queryClient.setQueryData(['other-investments'], data),
  });

  const sellMutation = useMutation({
    mutationFn: (params: Parameters<typeof api.sellOtherInvestment>[0]) => api.sellOtherInvestment(params),
    onSuccess: (data) => {
      queryClient.setQueryData(['other-investments'], data);
      setSellInvestment(null);
      invalidate();
    },
  });

  const isSyncing = isFetching || addMutation.isPending;
  const lastSyncTime = dataUpdatedAt > 0 ? new Date(dataUpdatedAt) : null;
  const hasGold = investments.some((inv) => inv.type === 'gold');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-widest text-muted-foreground">OTHER INVESTMENTS</h1>
        <div className="flex items-center gap-2">
          {lastSyncTime && hasGold && (
            <span className="text-xs text-muted-foreground">
              synced {lastSyncTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {hasGold && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.refetchQueries({ queryKey: ['other-investments'] })}
              disabled={isSyncing}
              className="gap-1.5 tracking-widest"
            >
              <span className={isSyncing ? 'animate-spin inline-block' : ''}>↻</span>
              {isSyncing ? 'SYNCING' : 'SYNC'}
            </Button>
          )}
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="tracking-widest">
            + ADD
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-8 text-center tracking-widest">LOADING...</div>
      ) : (
        <>
          {investments.length > 0 && <OtherPortfolioSummary investments={investments} />}
          <OtherInvestmentTable
            investments={investments}
            onDelete={(id) => deleteMutation.mutate(id)}
            onSell={(inv) => setSellInvestment(inv)}
          />
        </>
      )}

      <AddOtherInvestmentModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onAdd={(inv) => addMutation.mutate(inv)}
      />

      {sellInvestment && (
        <SellOtherInvestmentModal
          open={!!sellInvestment}
          onOpenChange={(open) => { if (!open) setSellInvestment(null); }}
          investment={sellInvestment}
          onSell={(params) => sellMutation.mutate(params)}
        />
      )}
    </div>
  );
}
