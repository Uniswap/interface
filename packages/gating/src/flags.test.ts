import {
  ALL_FEATURE_FLAG_NAMES_RECORD,
  FeatureFlagClient,
  FeatureFlags,
  getFeatureFlagName,
  SHARED_FEATURE_FLAG_NAMES,
  WALLET_FEATURE_FLAG_NAMES,
  WEB_FEATURE_FLAG_NAMES,
} from '@universe/gating/src/flags'
import { describe, expect, it, vi } from 'vitest'

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

const ALL_FLAGS = Object.values(FeatureFlags).filter((value): value is FeatureFlags => typeof value === 'number')

describe('FeatureFlags name mappings', () => {
  it('maps every flag to a name on at least one platform', () => {
    const unmappedFlags = ALL_FLAGS.filter(
      (flag) => !WEB_FEATURE_FLAG_NAMES.has(flag) && !WALLET_FEATURE_FLAG_NAMES.has(flag),
    ).map((flag) => FeatureFlags[flag])
    expect(unmappedFlags).toEqual([])
  })

  it('maps every flag to a non-empty name in the merged record', () => {
    for (const flag of ALL_FLAGS) {
      const name = ALL_FEATURE_FLAG_NAMES_RECORD[flag]
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    }
  })

  it.each([
    ['SHARED_FEATURE_FLAG_NAMES', SHARED_FEATURE_FLAG_NAMES],
    ['WEB_FEATURE_FLAG_NAMES', WEB_FEATURE_FLAG_NAMES],
    ['WALLET_FEATURE_FLAG_NAMES', WALLET_FEATURE_FLAG_NAMES],
  ])('%s has unique names', (_label, map) => {
    const names = [...map.values()]
    expect(new Set(names).size).toBe(names.length)
  })

  it('includes all shared names in both platform maps', () => {
    for (const [flag, name] of SHARED_FEATURE_FLAG_NAMES) {
      expect(WEB_FEATURE_FLAG_NAMES.get(flag)).toBe(name)
      expect(WALLET_FEATURE_FLAG_NAMES.get(flag)).toBe(name)
    }
  })
})

describe('getFeatureFlagName', () => {
  it('resolves shared flags for both clients', () => {
    expect(getFeatureFlagName(FeatureFlags.UniswapX, FeatureFlagClient.Web)).toBe('uniswapx')
    expect(getFeatureFlagName(FeatureFlags.UniswapX, FeatureFlagClient.Wallet)).toBe('uniswapx')
  })

  it('resolves platform-specific flags for their client', () => {
    expect(getFeatureFlagName(FeatureFlags.AATestWeb, FeatureFlagClient.Web)).toBe('aatest_web')
    expect(getFeatureFlagName(FeatureFlags.UwULink, FeatureFlagClient.Wallet)).toBe('uwu-link')
  })

  it('resolves every flag mapped for the requested client', () => {
    for (const [flag, name] of WEB_FEATURE_FLAG_NAMES) {
      expect(getFeatureFlagName(flag, FeatureFlagClient.Web)).toBe(name)
    }
    for (const [flag, name] of WALLET_FEATURE_FLAG_NAMES) {
      expect(getFeatureFlagName(flag, FeatureFlagClient.Wallet)).toBe(name)
    }
  })

  it('resolves flags using the default client when none is provided', () => {
    expect(getFeatureFlagName(FeatureFlags.UniswapX)).toBe('uniswapx')
  })

  it('throws for a flag that is not mapped on the requested platform', () => {
    expect(() => getFeatureFlagName(FeatureFlags.AATestWeb, FeatureFlagClient.Wallet)).toThrow(
      'Feature AATestWeb does not have a name mapped for this application',
    )
    expect(() => getFeatureFlagName(FeatureFlags.UwULink, FeatureFlagClient.Web)).toThrow(
      'Feature UwULink does not have a name mapped for this application',
    )
  })
})
