import { useTokenKYCStatus } from 'uniswap/src/features/permissionedTokens/useTokenKYCStatus'
import { useAccount } from '~/hooks/useAccount'

export type TDPPermissionedState = {
  isPermissioned: boolean
  isAllowlisted: boolean
  isLoading: boolean
  kycUrl: string | undefined
  issuer: string | undefined
  // Connected wallet has been verified by the issuer for this token.
  isVerified: boolean
  // Connected wallet must complete KYC before this token is tradeable, and a registration URL is available.
  isBlocked: boolean
}

// Single source of truth for permissioned-token state on web TDP siblings (header lock,
// action tabs, swap component, token description). All consumers should read from this
// hook so the blocking/verified predicates stay aligned across the page. Mirrors the
// mobile pattern where `TokenDetailsContext` exposes the same shape via context.
export function useTDPPermissionedState({
  tokenAddress,
  chainId,
}: {
  tokenAddress: string | undefined
  chainId: number | undefined
}): TDPPermissionedState {
  const account = useAccount()
  const { isPermissioned, isAllowlisted, isLoading, kycUrl, issuer } = useTokenKYCStatus({
    tokenAddress,
    chainId,
    walletAddress: account.address,
  })

  const hasAccount = !!account.address
  return {
    isPermissioned,
    isAllowlisted,
    isLoading,
    kycUrl,
    issuer,
    isVerified: hasAccount && isPermissioned && isAllowlisted,
    isBlocked: hasAccount && isPermissioned && !isAllowlisted && !!kycUrl,
  }
}
