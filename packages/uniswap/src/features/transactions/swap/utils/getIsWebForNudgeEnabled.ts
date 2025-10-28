import { Experiments, getExperimentValue, WebFORNudgesProperties } from '@universe/gating'
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
