import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { Investment } from '../../types/investment'
import { formatINR } from '../../utils/format'

const today = new Date().toISOString().slice(0, 10)

const schema = z.object({
  quantity_sold: z.number({ error: 'Required' }).positive('Must be > 0'),
  sell_price_per_unit: z.number({ error: 'Required' }).positive('Must be > 0'),
  sell_date: z.string().min(1, 'Required'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  holding: Investment
  onSell: (params: {
    id: string
    quantity_sold: number
    sell_price_per_unit: number
    sell_date: string
    notes?: string | null
  }) => void
}

export default function SellHoldingModal({ open, onOpenChange, holding, onSell }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity_sold: undefined,
      sell_price_per_unit: holding.currentPrice ?? holding.avgBuyPrice,
      sell_date: today,
      notes: '',
    },
  })

  const qty = form.watch('quantity_sold')
  const price = form.watch('sell_price_per_unit')
  const proceeds = (qty ?? 0) * (price ?? 0)
  const invested = (qty ?? 0) * holding.avgBuyPrice
  const pnl = proceeds - invested
  const isFullSell = qty != null && Math.abs(qty - holding.quantity) < 1e-9

  function handleOpenChange(next: boolean) {
    if (!next) form.reset()
    onOpenChange(next)
  }

  function onSubmit(values: FormValues) {
    onSell({
      id: holding.id,
      quantity_sold: values.quantity_sold,
      sell_price_per_unit: values.sell_price_per_unit,
      sell_date: values.sell_date,
      notes: values.notes || null,
    })
    handleOpenChange(false)
  }

  const isMF = holding.type === 'mf'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-none p-6 gap-0">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-base font-semibold tracking-wide">SELL HOLDING</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">{holding.name}</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Quick fill — sell all */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border border-border px-3 py-2">
              <span>Holding: <span className="font-mono text-foreground">{holding.quantity.toLocaleString()} {isMF ? 'units' : 'shares'}</span></span>
              <button
                type="button"
                className="text-xs text-primary hover:underline tracking-widest"
                onClick={() => form.setValue('quantity_sold', holding.quantity)}
              >
                SELL ALL
              </button>
            </div>

            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="quantity_sold"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs text-muted-foreground tracking-widest">
                      {isMF ? 'UNITS TO SELL' : 'SHARES TO SELL'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="any"
                        min="0"
                        max={holding.quantity}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sell_price_per_unit"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs text-muted-foreground tracking-widest">SELL PRICE (₹/{isMF ? 'unit' : 'share'})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="any"
                        min="0"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sell_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground tracking-widest">SELL DATE</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground tracking-widest">NOTES (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Booked profit" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* P&L preview */}
            {qty > 0 && price > 0 && (
              <div className="border border-border px-3 py-2.5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proceeds</span>
                  <span className="font-mono">{formatINR(proceeds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost basis</span>
                  <span className="font-mono">{formatINR(invested)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 mt-1">
                  <span className="text-muted-foreground">Realized P&amp;L</span>
                  <span className={`font-mono font-semibold ${pnl >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                  </span>
                </div>
                {isFullSell && (
                  <p className="text-muted-foreground text-[10px] pt-0.5">Full sell — holding will be removed.</p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1 tracking-widest">
                CANCEL
              </Button>
              <Button type="submit" className="flex-1 tracking-widest">
                CONFIRM SELL
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
