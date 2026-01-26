import { Experiments, getExperimentValue, WebFORNudgesProperties } from '@universe/gating'
import { isWebApp } from 'utilities/src/platform'

export function getIsWebFORNudgeEnabled(): boolean {
  if (!isWebApp) {
    return false
  }

  const result = getExperimentValue({
    experiment: Experiments.WebFORNudges,
    param: WebFORNudgesProperties.NudgeEnabled,
    defaultValue: false,
  })

  return result
}
