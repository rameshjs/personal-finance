import { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import type { MFSearchResult } from '../../types/investment';
import { api } from '../../services/tauri';
import type { HoldingFormValues } from './AddHoldingModal';

export default function MFSearchField() {
  const form = useFormContext<HoldingFormValues>();
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedFund, setSelectedFund] = useState<MFSearchResult | null>(null);

  const updateDebouncedQuery = useMemo(
    () => _.debounce((q: string) => setDebouncedQuery(q), 400),
    []
  );

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['mf-search', debouncedQuery],
    queryFn: () => api.searchMutualFunds(debouncedQuery),
    enabled: debouncedQuery.length > 1,
    staleTime: 30_000,
  });

  function selectFund(fund: MFSearchResult) {
    setSelectedFund(fund);
    setInputValue(fund.schemeName);
    setDebouncedQuery('');
    form.setValue('ticker', fund.schemeCode, { shouldValidate: true });
    form.setValue('name', fund.schemeName, { shouldValidate: true });
  }

  function clearSelection() {
    setSelectedFund(null);
    setInputValue('');
    setDebouncedQuery('');
    form.setValue('ticker', '');
    form.setValue('name', '');
  }

  const showDropdown = searchResults.length > 0 && !selectedFund;

  return (
    <FormField
      control={form.control}
      name="ticker"
      render={({ fieldState }) => (
        <FormItem className="relative">
          <FormLabel className="text-xs text-muted-foreground tracking-widest">SEARCH FUND</FormLabel>
          <FormControl>
            <Input
              value={inputValue}
              placeholder="e.g. HDFC Mid Cap or Parag Parikh"
              onChange={(e) => {
                setInputValue(e.target.value);
                setSelectedFund(null);
                form.setValue('ticker', '');
                form.setValue('name', '');
                updateDebouncedQuery(e.target.value);
              }}
            />
          </FormControl>

          {isSearching && (
            <p className="text-xs text-muted-foreground mt-1">Searching...</p>
          )}

          {showDropdown && (
            <div className="absolute z-10 left-0 right-0 bg-card border border-border max-h-48 overflow-y-auto shadow-lg">
              {searchResults.map((fund) => (
                <Button
                  key={fund.schemeCode}
                  type="button"
                  variant="ghost"
                  onClick={() => selectFund(fund)}
                  className="w-full justify-start h-auto px-3 py-2 rounded-none border-b border-border last:border-0 text-xs"
                >
                  <div className="text-left">
                    <div className="truncate">{fund.schemeName}</div>
                    <div className="text-muted-foreground">{fund.schemeCode}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {selectedFund && (
            <p className="text-xs text-primary mt-1">
              ✓ {selectedFund.schemeName} ({selectedFund.schemeCode})
              <button
                type="button"
                onClick={clearSelection}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </p>
          )}

          {fieldState.error && !selectedFund && (
            <FormMessage className="text-xs">Select a fund from the results</FormMessage>
          )}
        </FormItem>
      )}
    />
  );
}
