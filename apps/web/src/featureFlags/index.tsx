import useParsedQueryString from 'hooks/useParsedQueryString'
import { useContext, useEffect } from 'react'
import { Statsig, StatsigContext } from 'uniswap/src/features/gating/sdk/statsig'

export function useFeatureFlagURLOverrides() {
  const parsedQs = useParsedQueryString()
  const statsigContext = useContext(StatsigContext)

  useEffect(() => {
    // Override on
    const featureFlagOverrides =
      typeof parsedQs.featureFlagOverride === 'string' ? parsedQs.featureFlagOverride.split(',') : []
    // Override off
    const featureFlagOverridesOff =
      typeof parsedQs.featureFlagOverrideOff === 'string' ? parsedQs.featureFlagOverrideOff.split(',') : []

    if (statsigContext.initialized) {
      featureFlagOverrides.forEach((gate) => Statsig.overrideGate(gate, true))
      featureFlagOverridesOff.forEach((gate) => Statsig.overrideGate(gate, false))
    }
  }, [statsigContext.initialized, parsedQs.featureFlagOverride, parsedQs.featureFlagOverrideOff])
}
