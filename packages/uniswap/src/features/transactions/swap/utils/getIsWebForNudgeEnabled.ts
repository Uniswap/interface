import { Experiments, WebFORNudgesProperties } from 'uniswap/src/features/gating/experiments'
import { getExperimentValue } from 'uniswap/src/features/gating/hooks'
import { isInterface } from 'utilities/src/platform'

export function getIsWebFORNudgeEnabled(): boolean {
  if (!isInterface) {
    return false
  }

  return getExperimentValue({
    experiment: Experiments.WebFORNudges,
    param: WebFORNudgesProperties.NudgeEnabled,
    defaultValue: false,
  })
}
