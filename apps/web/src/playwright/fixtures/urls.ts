import { FeatureFlagClient, type FeatureFlags, getFeatureFlagName } from '@universe/gating'
import path from 'path'

export function createTestUrlBuilder({
  basePath,
  defaultQueryParams,
  defaultFeatureFlags,
}: {
  basePath: string
  defaultQueryParams?: Record<string, string>
  defaultFeatureFlags?: Partial<Record<FeatureFlags, boolean>>
}) {
  return ({
    subPath,
    queryParams,
    featureFlags,
  }: {
    subPath?: string
    queryParams?: Record<string, string>
    featureFlags?: Partial<Record<FeatureFlags, boolean>>
  }) => {
    const isAbsoluteUrl = basePath.startsWith('http')

    // Join basePath and subPath
    let base: string
    let combinedPath: string
    if (isAbsoluteUrl) {
      const baseUrlObj = new URL(basePath)
      base = baseUrlObj.origin
      combinedPath = path.join(baseUrlObj.pathname, subPath ?? '')
    } else {
      // placeholder base for relative URLs
      base = 'http://localhost'
      combinedPath = path.join('/', basePath, subPath ?? '')
    }

    const url = new URL(combinedPath, base)

    const combinedQueryParams = { ...defaultQueryParams, ...queryParams }
    for (const [key, value] of Object.entries(combinedQueryParams)) {
      url.searchParams.set(key, value)
    }
    // Build featureFlagOverrides (true) and featureFlagOverridesOff (false) params
    const combinedFeatureFlags = { ...defaultFeatureFlags, ...featureFlags }
    const enabledFlags = Object.entries(combinedFeatureFlags)
      .filter(([_, value]) => value)
      .map(([flag]) => getFeatureFlagName(Number(flag) as FeatureFlags, FeatureFlagClient.Web))
    if (enabledFlags.length > 0) {
      url.searchParams.set('featureFlagOverride', enabledFlags.join(','))
    }
    const disabledFlags = Object.entries(combinedFeatureFlags)
      .filter(([_, value]) => !value)
      .map(([flag]) => getFeatureFlagName(Number(flag) as FeatureFlags, FeatureFlagClient.Web))
    if (disabledFlags.length > 0) {
      url.searchParams.set('featureFlagOverrideOff', disabledFlags.join(','))
    }

    // Return full URL for absolute, pathname + search for relative
    return isAbsoluteUrl ? url.toString() : url.pathname + url.search
  }
}
