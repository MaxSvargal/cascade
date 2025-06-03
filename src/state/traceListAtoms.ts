// Jotai Atoms for Trace List State
// Generated from cfv_designs.TraceListService

import { atom } from 'jotai';
import { HistoricalFlowInstanceSummary } from '@/models/cfv_models_generated';

// Stores the list of historical flow run summaries
export const traceListSummariesAtom = atom<HistoricalFlowInstanceSummary[]>([]);

// Currently selected trace ID
export const selectedTraceIdAtom = atom<string | null>(null);

// Trace list loading state
export const traceListLoadingAtom = atom<boolean>(false);

// Trace list error state
export const traceListErrorAtom = atom<string | null>(null);

// Filter options for trace list
export const traceListFilterAtom = atom<{
  flowFqn?: string;
  status?: string;
  dateRange?: { start: string; end: string };
}>({});

// Derived atom for filtered trace summaries
export const filteredTraceListAtom = atom((get) => {
  const summaries = get(traceListSummariesAtom);
  const filter = get(traceListFilterAtom);
  
  return summaries.filter(summary => {
    if (filter.flowFqn && summary.flowFqn !== filter.flowFqn) {
      return false;
    }
    if (filter.status && summary.status !== filter.status) {
      return false;
    }
    if (filter.dateRange) {
      const summaryDate = new Date(summary.startTime);
      const startDate = new Date(filter.dateRange.start);
      const endDate = new Date(filter.dateRange.end);
      if (summaryDate < startDate || summaryDate > endDate) {
        return false;
      }
    }
    return true;
  });
});

// Derived atom for selected trace summary
export const selectedTraceSummaryAtom = atom((get) => {
  const selectedId = get(selectedTraceIdAtom);
  const summaries = get(traceListSummariesAtom);
  return summaries.find(summary => summary.id === selectedId) || null;
});

// Action atom for selecting a trace
export const selectTraceAtom = atom(
  null,
  (get, set, traceId: string | null) => {
    set(selectedTraceIdAtom, traceId);
  }
);

// Action atom for updating trace list
export const updateTraceListAtom = atom(
  null,
  (get, set, summaries: HistoricalFlowInstanceSummary[]) => {
    set(traceListSummariesAtom, summaries);
    set(traceListLoadingAtom, false);
    set(traceListErrorAtom, null);
  }
);

// Action atom for setting trace list loading state
export const setTraceListLoadingAtom = atom(
  null,
  (get, set, loading: boolean) => {
    set(traceListLoadingAtom, loading);
    if (loading) {
      set(traceListErrorAtom, null);
    }
  }
);

// Action atom for setting trace list error
export const setTraceListErrorAtom = atom(
  null,
  (get, set, error: string | null) => {
    set(traceListErrorAtom, error);
    set(traceListLoadingAtom, false);
  }
); 