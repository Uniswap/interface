import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'

/**
 * Merges multiple verification statuses, prioritizing the most severe status
 * Threat > Unverified > Verified
 */
export function mergeVerificationStatuses(
  status1?: DappVerificationStatus,
  status2?: DappVerificationStatus,
): DappVerificationStatus {
  // If either is undefined, return the other or default to Unverified
  if (!status1 || !status2) {
    return status1 ?? status2 ?? DappVerificationStatus.Unverified
  }

  // Threat takes precedence
  if (status1 === DappVerificationStatus.Threat || status2 === DappVerificationStatus.Threat) {
    return DappVerificationStatus.Threat
  }

  // Unverified takes precedence over verified
  if (status1 === DappVerificationStatus.Unverified || status2 === DappVerificationStatus.Unverified) {
    return DappVerificationStatus.Unverified
  }

  return DappVerificationStatus.Verified
}
