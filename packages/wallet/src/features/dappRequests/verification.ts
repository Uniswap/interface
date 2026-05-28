import { UNISWAP_WEB_HOSTNAME } from 'uniswap/src/constants/urls'
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

const FIRST_PARTY_HOSTNAMES: ReadonlySet<string> = new Set([UNISWAP_WEB_HOSTNAME])

export function isFirstPartyDapp(url: string | undefined): boolean {
  if (!url) {
    return false
  }
  try {
    return FIRST_PARTY_HOSTNAMES.has(new URL(url).hostname)
  } catch {
    return false
  }
}

/**
 * Treats first-party Uniswap dapps as Verified when upstream signals (Blockaid, WC Verify)
 * default to Unverified due to indexing gaps or transient failures. Threat is preserved so
 * a genuine malicious signal is never suppressed.
 *
 * IMPORTANT: `url` must come from a trusted source (e.g. WC Verify's `verified.origin` or
 * the browser origin in the extension). Never pass dapp-supplied metadata URLs — a
 * malicious dapp could otherwise claim a first-party hostname and be force-upgraded to
 * Verified. When no trusted URL is available, pass `undefined` and the override is skipped.
 */
export function applyFirstPartyOverride(
  status: DappVerificationStatus,
  url: string | undefined,
): DappVerificationStatus {
  if (status === DappVerificationStatus.Threat) {
    return status
  }
  return isFirstPartyDapp(url) ? DappVerificationStatus.Verified : status
}
