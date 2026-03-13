import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { HoldingFormValues } from './AddHoldingModal';

export default function StockFields() {
  const form = useFormContext<HoldingFormValues>();

  return (
    <>
      <div className="flex gap-2">
        <FormField
          control={form.control}
          name="ticker"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-xs text-muted-foreground tracking-widest">NSE/BSE SYMBOL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. GOLDBEES"
                  className="uppercase"
                  onChange={(e) => {
                    const upper = e.target.value.toUpperCase();
                    field.onChange(upper);
                    form.setValue('name', upper);
                  }}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="exchange"
          render={({ field }) => (
            <FormItem className="w-20">
              <FormLabel className="text-xs text-muted-foreground tracking-widest">EXCHANGE</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NS">NSE</SelectItem>
                  <SelectItem value="BO">BSE</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs text-muted-foreground tracking-widest">DISPLAY NAME</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. Nippon Gold ETF" />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </>
  );
}
