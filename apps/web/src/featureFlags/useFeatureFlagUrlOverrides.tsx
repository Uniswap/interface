import { isProdEnv } from '@universe/environment'
import {
  applyGatingUrlOverrides,
  getOverrideAdapter,
  parseGatingUrlOverrides,
  useStatsigClientStatus,
} from '@universe/gating'
import { useEffect } from 'react'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'

/** Applies `?featureFlagOverride=…` & co. (see @universe/gating urlOverrides) as local overrides outside production. */
export function useFeatureFlagUrlOverrides() {
  const { useParsedQueryString } = useUrlContext()
  const { isStatsigUninitialized } = useStatsigClientStatus()
  const parsedQs = useParsedQueryString()
  const isProduction = isProdEnv() && window.location.hostname !== 'localhost'

  useEffect(() => {
    if (isStatsigUninitialized || isProduction) {
      return
    }
    applyGatingUrlOverrides(parseGatingUrlOverrides(parsedQs), getOverrideAdapter())
  }, [parsedQs, isProduction, isStatsigUninitialized])
}
