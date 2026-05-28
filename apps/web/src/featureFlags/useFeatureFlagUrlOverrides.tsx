import { useEffect } from 'react'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { useStatsigClientStatus } from 'uniswap/src/features/gating/hooks'
import { getOverrideAdapter } from 'uniswap/src/features/gating/sdk/statsig'
import { isProdEnv } from 'utilities/src/environment/env'

export function useFeatureFlagUrlOverrides() {
  const { useParsedQueryString } = useUrlContext()
  const { isStatsigUninitialized } = useStatsigClientStatus()
  const parsedQs = useParsedQueryString()
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
    if (!isStatsigUninitialized && !isProduction) {
      featureFlagOverrides.forEach((gate) => getOverrideAdapter().overrideGate(gate, true))
      featureFlagOverridesOff.forEach((gate) => getOverrideAdapter().overrideGate(gate, false))
      experimentOverrides.forEach((experiment) => {
        const [experimentName, groupName] = experiment.split(':')
        getOverrideAdapter().overrideDynamicConfig(experimentName, { group: groupName })
      })
    }
  }, [parsedQs, isProduction, isStatsigUninitialized])
}
