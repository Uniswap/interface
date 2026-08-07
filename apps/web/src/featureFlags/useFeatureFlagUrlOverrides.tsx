import { isProdEnv } from '@universe/environment'
import { getOverrideAdapter, useStatsigClientStatus } from '@universe/gating'
import { useEffect } from 'react'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'

function parseExperimentOverrideValue(value: string): boolean | number | string {
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  const asNumber = Number(value)
  return value.length > 0 && !Number.isNaN(asNumber) ? asNumber : value
}

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

    // Layer overrides
    const layerOverrides = typeof parsedQs.layerOverride === 'string' ? parsedQs.layerOverride.split(',') : []
    const layerOverridesOff = typeof parsedQs.layerOverrideOff === 'string' ? parsedQs.layerOverrideOff.split(',') : []

    if (!isStatsigUninitialized && !isProduction) {
      featureFlagOverrides.forEach((gate) => getOverrideAdapter().overrideGate(gate, true))
      featureFlagOverridesOff.forEach((gate) => getOverrideAdapter().overrideGate(gate, false))
      experimentOverrides.forEach((experiment) => {
        const [experimentName, paramOrGroup, ...valueParts] = experiment.split(':')
        if (!experimentName) {
          return
        }
        if (paramOrGroup && valueParts.length > 0) {
          // `name:param:value` overrides a single experiment param value (for param-value experiments)
          getOverrideAdapter().overrideExperiment(experimentName, {
            [paramOrGroup]: parseExperimentOverrideValue(valueParts.join(':')),
          })
        } else {
          // `name:group` overrides the assigned group
          getOverrideAdapter().overrideDynamicConfig(experimentName, { group: paramOrGroup })
        }
      })
      layerOverrides.forEach((layer) => {
        const [layerName, groupName] = layer.split(':')
        getOverrideAdapter().overrideLayer(layerName, { [groupName]: true })
      })
      layerOverridesOff.forEach((layer) => {
        const [layerName, groupName] = layer.split(':')
        getOverrideAdapter().overrideLayer(layerName, { [groupName]: false })
      })
    }
  }, [parsedQs, isProduction, isStatsigUninitialized])
}
