import { useContext, useEffect } from 'react'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { Statsig, StatsigContext } from 'uniswap/src/features/gating/sdk/statsig'
import { isProdEnv } from 'utilities/src/environment/env'

export function useFeatureFlagUrlOverrides() {
  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  const statsigContext = useContext(StatsigContext)
  const isProduction = isProdEnv() && window.location.hostname !== 'localhost'

  useEffect(() => {
    // Override on
    const featureFlagOverrides =
      typeof parsedQs.featureFlagOverride === 'string' ? parsedQs.featureFlagOverride.split(',') : []
    // Override off
    const featureFlagOverridesOff =
      typeof parsedQs.featureFlagOverrideOff === 'string' ? parsedQs.featureFlagOverrideOff.split(',') : []

    // Experiment overrides
    const experimentOverrides =
      typeof parsedQs.experimentOverride === 'string' ? parsedQs.experimentOverride.split(',') : []

    if (statsigContext.initialized && !isProduction) {
      featureFlagOverrides.forEach((gate) => Statsig.overrideGate(gate, true))
      featureFlagOverridesOff.forEach((gate) => Statsig.overrideGate(gate, false))
      experimentOverrides.forEach((experiment) => {
        const [experimentName, groupName] = experiment.split(':')
        Statsig.overrideConfig(experimentName, { group: groupName })
      })
    }
  }, [statsigContext.initialized, parsedQs, isProduction])
}
