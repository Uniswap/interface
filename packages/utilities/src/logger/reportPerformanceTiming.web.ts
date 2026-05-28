import { datadogRum } from '@datadog/browser-rum'
import { DDRumAction } from 'utilities/src/logger/datadog/datadogEvents'

export function reportPerformanceTiming(eventName: string, durationMs: number): void {
  datadogRum.addAction(DDRumAction.ManualTiming, { duration: durationMs, eventName })
}
