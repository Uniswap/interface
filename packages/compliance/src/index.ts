/**
 * @universe/compliance
 *
 * Public entry point. All exports must be listed here. Deep imports are
 * forbidden and will be blocked by lint.
 */

export { GatedFeature, RestrictionReason } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
export type { ComplianceTokenInput, ComplianceV2Client, ScreenAddressInput } from '@universe/compliance/src/client'
export { createComplianceV2Client, screenAddress } from '@universe/compliance/src/client'
export { ComplianceClientProvider } from '@universe/compliance/src/ComplianceClientProvider'
export {
  clearComplianceOverrides,
  GATED_FEATURE_OPTIONS,
  RESTRICTION_REASON_OPTIONS,
  setComplianceOverrideEnabled,
  toggleFeatureGated,
  toggleTokenReasonOverride,
  useComplianceOverrideEnabled,
  useGatedFeatureSet,
  useOverriddenTokenReasons,
} from '@universe/compliance/src/devComplianceOverride'
export { useComplianceClient } from '@universe/compliance/src/useComplianceClient'
export { useSetTokenAcknowledgement, useTokenComplianceStatus } from '@universe/compliance/src/featureGatedTokenQuery'
export { useGatedFeatures, useIsFeatureGated } from '@universe/compliance/src/gatedFeaturesQuery'
export { useIsBlockedAddress } from '@universe/compliance/src/screenAddressQuery'
export {
  hasUnrecognizedReason,
  isAckGated,
  isAcknowledged,
  isHardBlocked,
  requiresAcknowledgement,
} from '@universe/compliance/src/reasons'
