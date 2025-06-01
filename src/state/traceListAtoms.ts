// Jotai Atoms for Trace List State
// Generated from cfv_designs.TraceListService

import { atom } from 'jotai';
import { HistoricalFlowInstanceSummary } from '@/models/cfv_models_generated';

// Stores the list of historical flow run summaries
export const traceListSummariesAtom = atom<HistoricalFlowInstanceSummary[]>([]); 