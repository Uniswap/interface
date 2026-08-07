import { UNCONNECTED_ADDRESS } from '@universe/api'
import { useCheckPermissionsQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckPermissionsQuery'
import { sanitizeUrl } from 'utilities/src/format/urls'

// Shared shape for permissioned-token + wallet-allowlist state. Composed by the
// single-token hook (`useTokenKYCStatus`) and the swap-pair hook
// (`usePermissionedSwapPair`); both fail open while loading, on error, and pre-wallet.
export type PermissionedTokenStatus = {
  isPermissioned: boolean
  isAllowlisted: boolean
  isLoading: boolean
  kycUrl?: string
  issuer?: string
}

export function useTokenKYCStatus({
  tokenAddress,
  chainId,
  walletAddress,
}: {
  tokenAddress: string | undefined
  chainId: number | undefined
  walletAddress: string | undefined
}): PermissionedTokenStatus {
  const hasRealWallet = !!walletAddress

  // BE matches on lowercased addresses (on-chain adapter map keyed by lowercase).
  const params =
    chainId && tokenAddress
      ? {
          walletAddress: (walletAddress ?? UNCONNECTED_ADDRESS).toLowerCase(),
          tokens: [tokenAddress.toLowerCase()],
          chainId,
        }
      : undefined

  // queryFn-level error is already logged in useCheckPermissionsQuery; failing open here.
  const { data, isLoading } = useCheckPermissionsQuery({ params })

  const tokenLower = tokenAddress?.toLowerCase()
  const apiResult = tokenLower ? data?.results.find((r) => r.token.toLowerCase() === tokenLower) : undefined

  if (!apiResult || !apiResult.isPermissioned) {
    return { isPermissioned: false, isAllowlisted: true, isLoading, kycUrl: undefined, issuer: undefined }
  }

  if (!hasRealWallet || apiResult.isAllowlisted) {
    return { isPermissioned: true, isAllowlisted: true, isLoading, kycUrl: undefined, issuer: apiResult.issuer }
  }

  return {
    isPermissioned: true,
    isAllowlisted: false,
    isLoading,
    kycUrl: sanitizeUrl({ url: apiResult.kycUrl, allowedProtocols: ['https:'], callerName: 'useTokenKYCStatus' }),
    issuer: apiResult.issuer,
  }
}
