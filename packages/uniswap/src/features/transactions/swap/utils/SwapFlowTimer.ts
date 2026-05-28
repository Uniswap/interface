import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { reportPerformanceTiming } from 'utilities/src/logger/reportPerformanceTiming'

export type SwapFlowMilestone =
  | typeof DDRumManualTiming.SwapModalOpen
  | typeof DDRumManualTiming.SwapFormScreenMount
  | typeof DDRumManualTiming.SwapDecimalPadLayout

/**
 * Per-modal-open timer that records elapsed time from modal open to key load milestones
 * and reports durations via DD RUM.
 *
 * This tracks deterministic load milestones (not user-dependent transitions).
 * For render performance measurement, use usePerformanceLogger instead.
 */
export class SwapFlowTimer {
  private startTime: number
  private marks = new Map<SwapFlowMilestone, number>()
  private disposed = false

  constructor() {
    this.startTime = performance.now()
  }

  mark(milestone: SwapFlowMilestone): void {
    if (this.disposed || this.marks.has(milestone)) {
      return
    }
    const elapsed = performance.now() - this.startTime
    this.marks.set(milestone, elapsed)
    reportPerformanceTiming(milestone, elapsed)
  }

  getElapsed(milestone: SwapFlowMilestone): number | undefined {
    return this.marks.get(milestone)
  }

  dispose(): void {
    this.disposed = true
  }
}
