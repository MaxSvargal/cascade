// Navigation Service Implementation
// Generated from cfv_designs.NavigationStateService

import { VisualizerModeEnum, ViewChangePayload } from '@/models/cfv_models_generated';

export interface NavigationServiceOptions {
  onViewChange?: (view: ViewChangePayload) => void;
}

export class NavigationService {
  private onViewChange?: (view: ViewChangePayload) => void;

  constructor(options: NavigationServiceOptions) {
    this.onViewChange = options.onViewChange;
  }

  /**
   * Navigate to a specific flow
   */
  navigateToFlow(flowFqn: string, mode: VisualizerModeEnum = 'design'): void {
    this.emitViewChange({
      mode,
      currentFlowFqn: flowFqn,
      systemViewActive: false
    });
  }

  /**
   * Navigate to system overview
   */
  navigateToSystemOverview(mode: VisualizerModeEnum = 'design'): void {
    this.emitViewChange({
      mode,
      currentFlowFqn: undefined,
      systemViewActive: true
    });
  }

  /**
   * Switch to trace mode for a specific flow
   */
  navigateToTrace(flowFqn: string): void {
    this.emitViewChange({
      mode: 'trace',
      currentFlowFqn: flowFqn,
      systemViewActive: false
    });
  }

  /**
   * Switch to test result mode for a specific flow
   */
  navigateToTestResult(flowFqn: string): void {
    this.emitViewChange({
      mode: 'test_result',
      currentFlowFqn: flowFqn,
      systemViewActive: false
    });
  }

  /**
   * Toggle between system overview and flow detail
   */
  toggleSystemView(currentFlowFqn: string | null, systemViewActive: boolean, mode: VisualizerModeEnum): void {
    if (systemViewActive) {
      // Switch to flow detail - use the last selected flow or null
      this.emitViewChange({
        mode,
        currentFlowFqn: currentFlowFqn || undefined,
        systemViewActive: false
      });
    } else {
      // Switch to system overview
      this.emitViewChange({
        mode,
        currentFlowFqn: undefined,
        systemViewActive: true
      });
    }
  }

  /**
   * Update mode while preserving current navigation state
   */
  updateMode(mode: VisualizerModeEnum, currentFlowFqn: string | null, systemViewActive: boolean): void {
    this.emitViewChange({
      mode,
      currentFlowFqn: currentFlowFqn || undefined,
      systemViewActive
    });
  }

  /**
   * Emit view change event
   */
  private emitViewChange(view: ViewChangePayload): void {
    if (this.onViewChange) {
      this.onViewChange(view);
    }
  }

  /**
   * Create navigation actions for components
   */
  createNavigationActions() {
    return {
      navigateToFlow: this.navigateToFlow.bind(this),
      navigateToSystemOverview: this.navigateToSystemOverview.bind(this),
      navigateToTrace: this.navigateToTrace.bind(this),
      navigateToTestResult: this.navigateToTestResult.bind(this),
      toggleSystemView: this.toggleSystemView.bind(this),
      updateMode: this.updateMode.bind(this)
    };
  }
} 