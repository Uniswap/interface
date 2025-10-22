import { Experiments, WebFORNudgesProperties } from 'uniswap/src/features/gating/experiments'
import { getExperimentValue } from 'uniswap/src/features/gating/hooks'
import { isWebApp } from 'utilities/src/platform'

export function getIsWebFORNudgeEnabled(): boolean {
  if (!isWebApp) {
    return false
  }

  return getExperimentValue({
    experiment: Experiments.WebFORNudges,
    param: WebFORNudgesProperties.NudgeEnabled,
    defaultValue: false,
  })
}
