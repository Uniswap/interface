import { useMemo } from 'react'
import { usePermissionedSwapPair } from 'uniswap/src/features/permissionedTokens/usePermissionedSwapPair'
import type { CurrencyState } from '~/features/Swap/state/types'
import { useAccount } from '~/hooks/useAccount'

export type PermissionedSwapState = {
  isPermissioned: boolean
  isPermissionedBlocked: boolean
  isLoading: boolean
  isAllowlisted: boolean
  permissionedTokenSymbol: string | undefined
  // KYC URL + issuer come straight from the trading-api `CheckPermissions` response.
  permissionedConfig: { registrationUrl: string; issuer: string } | undefined
  walletConnected: boolean
}

// Centralizes per-side detection so the swap page can gate tab content on `isPermissionedBlocked` without restating the input/output check.
export function usePermissionedSwap(currencyState: CurrencyState): PermissionedSwapState {
  const account = useAccount()

  const { isPermissioned, isAllowlisted, isLoading, permissionedSymbol, kycUrl, issuer } = usePermissionedSwapPair({
    inputCurrency: currencyState.inputCurrency,
    outputCurrency: currencyState.outputCurrency,
    walletAddress: account.address,
  })

  const walletConnected = !!account.address
  // Gate on !isAllowlisted so verified users don't carry a "needs KYC" config shape.
  // Require BOTH kycUrl and issuer (matches usePermissionedLP); empty issuer would interpolate
  // as a blank provider string in the modal copy. The VerifyIdentityModal falls back to
  // "verification temporarily unavailable" when the config is undefined.
  const permissionedConfig = useMemo(
    () => (isPermissioned && !isAllowlisted && kycUrl && issuer ? { registrationUrl: kycUrl, issuer } : undefined),
    [isPermissioned, isAllowlisted, kycUrl, issuer],
  )
  // Gate on kycUrl too: without it, VerifyIdentityModal has no URL to open.
  const isPermissionedBlocked = isPermissioned && !isAllowlisted && walletConnected && !!kycUrl

  return {
    isPermissioned,
    isPermissionedBlocked,
    isLoading,
    isAllowlisted,
    permissionedTokenSymbol: permissionedSymbol,
    permissionedConfig,
    walletConnected,
  }
}
