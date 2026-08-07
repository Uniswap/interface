import { useBlockaidVerification } from 'wallet/src/features/dappRequests/hooks/useBlockaidVerification'
import type { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'
import { applyFirstPartyOverride, isFirstPartyDapp } from 'wallet/src/features/dappRequests/verification'

interface UseSiteVerificationResult {
  verificationStatus?: DappVerificationStatus
  isFirstParty: boolean
}

/**
 * Site-level Blockaid verification for the header badge, contract row, and unverified-site
 * alert. `dappUrl` must be the trusted browser origin so the first-party override is safe.
 * Status is undefined while loading so the badge/alert don't flash an intermediate state.
 */
export function useSiteVerification(dappUrl: string): UseSiteVerificationResult {
  const { verificationStatus: blockaidStatus, isLoading } = useBlockaidVerification(dappUrl)

  return {
    verificationStatus: isLoading || !blockaidStatus ? undefined : applyFirstPartyOverride(blockaidStatus, dappUrl),
    isFirstParty: isFirstPartyDapp(dappUrl),
  }
}
