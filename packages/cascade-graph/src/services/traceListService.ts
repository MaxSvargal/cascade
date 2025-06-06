// Trace List Service Implementation
// Generated from cfv_designs.TraceListService

import { HistoricalFlowInstanceSummary, FlowRunListItemActions } from '@/models/cfv_models_generated';

export interface TraceListServiceOptions {
  fetchTraceList?: (filterOptions?: any) => Promise<HistoricalFlowInstanceSummary[]>;
  onTraceSelect?: (traceId: string) => void;
}

export class TraceListService {
  private fetchTraceList?: (filterOptions?: any) => Promise<HistoricalFlowInstanceSummary[]>;
  private onTraceSelect?: (traceId: string) => void;

  constructor(options: TraceListServiceOptions) {
    this.fetchTraceList = options.fetchTraceList;
    this.onTraceSelect = options.onTraceSelect;
  }

  /**
   * Fetch historical flow run summaries
   */
  async fetchTraceListSummaries(filterOptions?: any): Promise<HistoricalFlowInstanceSummary[]> {
    if (!this.fetchTraceList) {
      return [];
    }

    try {
      return await this.fetchTraceList(filterOptions);
    } catch (error) {
      console.error('Failed to fetch trace list:', error);
      return [];
    }
  }

  /**
   * Create actions for flow run list items
   */
  createFlowRunListItemActions(): FlowRunListItemActions {
    return {
      selectTrace: (traceIdOrInstanceId: string) => {
        if (this.onTraceSelect) {
          this.onTraceSelect(traceIdOrInstanceId);
        }
      }
    };
  }

  /**
   * Filter traces by flow FQN
   */
  filterTracesByFlow(traces: HistoricalFlowInstanceSummary[], flowFqn: string): HistoricalFlowInstanceSummary[] {
    return traces.filter(trace => trace.flowFqn === flowFqn);
  }

  /**
   * Filter traces by status
   */
  filterTracesByStatus(traces: HistoricalFlowInstanceSummary[], status: string): HistoricalFlowInstanceSummary[] {
    return traces.filter(trace => trace.status === status);
  }

  /**
   * Sort traces by start time (newest first)
   */
  sortTracesByTime(traces: HistoricalFlowInstanceSummary[]): HistoricalFlowInstanceSummary[] {
    return [...traces].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  /**
   * Get unique flow FQNs from traces
   */
  getUniqueFlowFqns(traces: HistoricalFlowInstanceSummary[]): string[] {
    const flowFqns = new Set(traces.map(trace => trace.flowFqn));
    return Array.from(flowFqns).sort();
  }

  /**
   * Get unique statuses from traces
   */
  getUniqueStatuses(traces: HistoricalFlowInstanceSummary[]): string[] {
    const statuses = new Set(traces.map(trace => trace.status));
    return Array.from(statuses).sort();
  }
} 