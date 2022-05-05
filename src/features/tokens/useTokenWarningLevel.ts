import { Currency } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import {
  addDismissedWarningToken,
  dismissedWarningTokensSelector,
} from 'src/features/tokens/tokensSlice'
import {
  useUniswapDefaultTokens,
  useUnsupportedTokens,
  useWarningTokens,
} from 'src/features/tokens/useTokens'
import { toSupportedChainId } from 'src/utils/chainId'
import { currencyId } from 'src/utils/currencyId'

export enum TokenWarningLevel {
  LOW = 'LOW', // light warning with features enabled
  MEDIUM = 'MEDIUM', // strong warning with features enabled
  BLOCKED = 'BLOCKED', // blocked from all interactions
}

export function useTokenWarningLevel(currency: Currency): {
  tokenWarningLevel: TokenWarningLevel | undefined // undefined means no warning
  tokenWarningDismissed: boolean // user dismissed warning
  warningDismissCallback: () => void // callback to dismiss warning
} {
  /**
   * TODO: replace warning list with remotely hosted warning tokenlist.
   */
  const uniswapDefaultTokens = useUniswapDefaultTokens()
  const warningTokens = useWarningTokens()
  const unsupportedTokens = useUnsupportedTokens()
  const chainId = toSupportedChainId(currency?.chainId)
  const id = currencyId(currency)

  const tokenWarningLevel = useMemo(() => {
    // no warning if invalid params or token on Uniswap default list
    if (!currency || !chainId || uniswapDefaultTokens[chainId]?.[id]) {
      return undefined
    }
    if (unsupportedTokens[chainId]?.[id]) {
      return TokenWarningLevel.BLOCKED
    }
    if (warningTokens[chainId]?.[id]) {
      return TokenWarningLevel.LOW
    }
    // default warning if no conditions met
    return TokenWarningLevel.MEDIUM
  }, [chainId, uniswapDefaultTokens, id, currency, unsupportedTokens, warningTokens])

  const dismissedTokens = useAppSelector(dismissedWarningTokensSelector)
  const tokenWarningDismissed = useMemo(() => {
    return Boolean(
      chainId && dismissedTokens && dismissedTokens[chainId]?.[currency.wrapped.address]
    )
  }, [chainId, currency.wrapped.address, dismissedTokens])

  const dispatch = useAppDispatch()
  const warningDismissCallback = useCallback(() => {
    if (chainId && currency.wrapped.address) {
      dispatch(addDismissedWarningToken({ address: currency.wrapped.address, chainId }))
    }
  }, [chainId, currency.wrapped.address, dispatch])

  return {
    tokenWarningLevel,
    tokenWarningDismissed,
    warningDismissCallback,
  }
}
