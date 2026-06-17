/**
 * @universe/compliance
 *
 * Public entry point. All exports must be listed here. Deep imports are
 * forbidden and will be blocked by lint.
 */

export { RestrictionReason } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'
export type { ComplianceTokenInput, ComplianceV2Client } from '@universe/compliance/src/client'
export { createComplianceV2Client } from '@universe/compliance/src/client'
export { ComplianceClientProvider } from '@universe/compliance/src/ComplianceClientProvider'
export { useComplianceClient } from '@universe/compliance/src/useComplianceClient'
export { useSetTokenAcknowledgement, useTokenComplianceStatus } from '@universe/compliance/src/featureGatedTokenQuery'
export {
  hasUnrecognizedReason,
  isAckGated,
  isAcknowledged,
  isHardBlocked,
  requiresAcknowledgement,
} from '@universe/compliance/src/reasons'
