import type { Currency } from '@uniswap/sdk-core'
import { usePermissionedSwapPair } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'
import { useAccount } from '~/hooks/useAccount'

type LPPermissionedGating = {
  isPermissioned: boolean
  isAllowlisted: boolean
  isPermissionedAndNotAllowlisted: boolean
  isLoading: boolean
  permissionedTokenSymbol: string | undefined
  // KYC URL + issuer come straight from the trading-api `CheckPermissions` response;
  // the type stays compatible with the existing modal/CTA call sites.
  permissionedConfig: { registrationUrl: string; issuer: string } | undefined
}

// Centralizes per-side detection so DepositStep can gate its CTA on `isPermissionedAndNotAllowlisted` without restating the token0/token1 check (Figma 114:21039).
export function useLPPermissionedGating({
  token0,
  token1,
}: {
  token0: Maybe<Currency>
  token1: Maybe<Currency>
}): LPPermissionedGating {
  const account = useAccount()

  const { isPermissioned, isAllowlisted, isLoading, permissionedSymbol, kycUrl, issuer } = usePermissionedSwapPair({
    inputCurrency: token0 ?? undefined,
    outputCurrency: token1 ?? undefined,
    walletAddress: account.address,
  })

  const isPermissionedAndNotAllowlisted = isPermissioned && !isAllowlisted
  // Require BOTH kycUrl and issuer; an empty issuer would interpolate as a blank
  // provider string in the modal copy. When undefined the Verify Identity modal
  // renders the "verification temporarily unavailable" fallback.
  const permissionedConfig = isPermissioned && kycUrl && issuer ? { registrationUrl: kycUrl, issuer } : undefined

  return {
    isPermissioned,
    isAllowlisted,
    isPermissionedAndNotAllowlisted,
    isLoading,
    permissionedTokenSymbol: permissionedSymbol,
    permissionedConfig,
  }
}
