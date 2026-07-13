import { GatedFeature, RestrictionReason } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
import {
  clearComplianceOverrides,
  GATED_FEATURE_OPTIONS,
  getComplianceOverrideState,
  RESTRICTION_REASON_OPTIONS,
  resolveGatedFeaturesOverride,
  resolveTokenReasonsOverride,
  setComplianceOverrideEnabled,
  toggleFeatureGated,
  toggleTokenReasonOverride,
} from '@universe/compliance/src/devComplianceOverride'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { isProdEnv } = vi.hoisted(() => ({ isProdEnv: vi.fn(() => false) }))
vi.mock('@universe/environment', () => ({ isProdEnv }))

describe('devComplianceOverride', () => {
  beforeEach(() => {
    isProdEnv.mockReturnValue(false)
    clearComplianceOverrides()
  })

  afterEach(() => {
    clearComplianceOverrides()
  })

  describe('proto-derived options', () => {
    it('lists gated features from the proto enum, excluding UNSPECIFIED', () => {
      expect(GATED_FEATURE_OPTIONS).toEqual([
        { value: GatedFeature.TOKEN_LAUNCHER, label: 'TOKEN_LAUNCHER' },
        { value: GatedFeature.ISSUER_SPECIFIC_RWA, label: 'ISSUER_SPECIFIC_RWA' },
      ])
    })

    it('lists restriction reasons from the proto enum, excluding UNSPECIFIED', () => {
      expect(RESTRICTION_REASON_OPTIONS.map((o) => o.value)).toEqual([
        RestrictionReason.DERIVATIVE,
        RestrictionReason.PERMISSIONLESS_SECURITY,
        RestrictionReason.REQUIRES_ACKNOWLEDGEMENT,
        RestrictionReason.ACKNOWLEDGED,
      ])
      expect(RESTRICTION_REASON_OPTIONS.every((o) => typeof o.label === 'string' && o.label.length > 0)).toBe(true)
    })
  })

  describe('state mutations', () => {
    it('defaults to disabled with empty sets', () => {
      expect(getComplianceOverrideState()).toEqual({ enabled: false, gatedFeatures: [], tokenReasons: [] })
    })

    it('toggles the enabled switch', () => {
      setComplianceOverrideEnabled(true)
      expect(getComplianceOverrideState().enabled).toBe(true)
    })

    it('toggles gated features and token reasons on and off', () => {
      toggleFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)
      toggleTokenReasonOverride(RestrictionReason.DERIVATIVE)
      expect(getComplianceOverrideState().gatedFeatures).toEqual([GatedFeature.ISSUER_SPECIFIC_RWA])
      expect(getComplianceOverrideState().tokenReasons).toEqual([RestrictionReason.DERIVATIVE])
      toggleFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)
      expect(getComplianceOverrideState().gatedFeatures).toEqual([])
    })

    it('clears everything', () => {
      setComplianceOverrideEnabled(true)
      toggleFeatureGated(GatedFeature.TOKEN_LAUNCHER)
      clearComplianceOverrides()
      expect(getComplianceOverrideState()).toEqual({ enabled: false, gatedFeatures: [], tokenReasons: [] })
    })
  })

  describe('resolveGatedFeaturesOverride', () => {
    it('passes through (undefined) while disabled', () => {
      expect(
        resolveGatedFeaturesOverride({
          enabled: false,
          gatedFeatures: [GatedFeature.ISSUER_SPECIFIC_RWA],
          tokenReasons: [],
        }),
      ).toBeUndefined()
    })

    it('reports exactly the gated set while enabled (empty = nothing gated)', () => {
      expect(resolveGatedFeaturesOverride({ enabled: true, gatedFeatures: [], tokenReasons: [] })).toEqual([])
      expect(
        resolveGatedFeaturesOverride({
          enabled: true,
          gatedFeatures: [GatedFeature.ISSUER_SPECIFIC_RWA],
          tokenReasons: [],
        }),
      ).toEqual([GatedFeature.ISSUER_SPECIFIC_RWA])
    })

    it('passes through (undefined) in prod even when enabled', () => {
      isProdEnv.mockReturnValue(true)
      expect(
        resolveGatedFeaturesOverride({
          enabled: true,
          gatedFeatures: [GatedFeature.ISSUER_SPECIFIC_RWA],
          tokenReasons: [],
        }),
      ).toBeUndefined()
    })
  })

  describe('resolveTokenReasonsOverride', () => {
    it('passes through while disabled and returns the checked reasons while enabled', () => {
      expect(
        resolveTokenReasonsOverride({
          enabled: false,
          gatedFeatures: [],
          tokenReasons: [RestrictionReason.DERIVATIVE],
        }),
      ).toBeUndefined()
      expect(
        resolveTokenReasonsOverride({
          enabled: true,
          gatedFeatures: [],
          tokenReasons: [RestrictionReason.ACKNOWLEDGED],
        }),
      ).toEqual([RestrictionReason.ACKNOWLEDGED])
    })

    it('passes through (undefined) in prod even when enabled', () => {
      isProdEnv.mockReturnValue(true)
      expect(
        resolveTokenReasonsOverride({ enabled: true, gatedFeatures: [], tokenReasons: [RestrictionReason.DERIVATIVE] }),
      ).toBeUndefined()
    })
  })
})
