import { DdRum, RumActionType } from '@datadog/mobile-react-native'
import { DDRumAction } from 'utilities/src/logger/datadog/datadogEvents'

export function reportPerformanceTiming(eventName: string, durationMs: number): void {
  DdRum.addAction(RumActionType.CUSTOM, DDRumAction.ManualTiming, {
    duration: durationMs,
    eventName,
  }).catch(() => undefined)
}
