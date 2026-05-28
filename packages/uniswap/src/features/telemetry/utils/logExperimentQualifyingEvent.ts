import { Experiments } from '@universe/gating'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export function logExperimentQualifyingEvent({ experiment }: { experiment: Experiments }): void {
  sendAnalyticsEvent(UniswapEventName.ExperimentQualifyingEvent, {
    experiment,
  })
}
