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
  NONE = 'NONE',
  LOW = 'LOW', // light warning with features enabled
  MEDIUM = 'MEDIUM', // strong warning with features enabled
  BLOCKED = 'BLOCKED', // blocked from all interactions
}

// Complete list of currencyId -> Warning level, based on token tracked lists
export interface TokenWarningLevelMap {
  [chainId: number]: {
    [currencyId: string]: TokenWarningLevel
  }
}

/**
 * Mapping of chainId -> currencyId -> warning level.
 * Useful when needed to check warnings for multiple tokens (remove call to store for every token)
 * @TODO move to context for better perf
 */
export function useCombinedTokenWarningLevelMap(): TokenWarningLevelMap {
  const uniswapDefaultTokens = useUniswapDefaultTokens()
  const warningTokens = useWarningTokens()
  const unsupportedTokens = useUnsupportedTokens()

  return useMemo(() => {
    let map: TokenWarningLevelMap = {}
    const allTokenMapsWithWarningLevel = [
      // last in array is highest priority for level assignment
      { map: warningTokens, level: TokenWarningLevel.LOW },
      { map: uniswapDefaultTokens, level: TokenWarningLevel.NONE },
      { map: unsupportedTokens, level: TokenWarningLevel.BLOCKED },
    ]

    allTokenMapsWithWarningLevel.map((tokenMap) => {
      Object.keys(tokenMap.map).forEach((chainId) => {
        const supportedChainId = toSupportedChainId(chainId)
        if (supportedChainId) {
          const tokens = tokenMap.map[supportedChainId] || {}
          Object.keys(tokens).forEach((id) => {
            map[supportedChainId] ||= {}
            map[supportedChainId][id] = tokenMap.level
          })
        }
      })
    })
    return map
  }, [uniswapDefaultTokens, unsupportedTokens, warningTokens])
}

export function useTokenWarningLevel(currency: Currency): {
  tokenWarningLevel: TokenWarningLevel // undefined means no warning
  tokenWarningDismissed: boolean // user dismissed warning
  warningDismissCallback: () => void // callback to dismiss warning
} {
  const chainId = toSupportedChainId(currency?.chainId)
  const id = currencyId(currency)
  const tokenWarningLevelMap = useCombinedTokenWarningLevelMap()

  const tokenWarningLevel = useMemo(() => {
    if (chainId) {
      // if token is on one of warning lists, assign warning level
      if (tokenWarningLevelMap[chainId]?.[id]) {
        return tokenWarningLevelMap[chainId][id]
      }
    }
    // default warning if no conditions met
    return TokenWarningLevel.MEDIUM
  }, [chainId, tokenWarningLevelMap, id])

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

export function useTokenWarningLevelColors(tokenWarningLevel: TokenWarningLevel | undefined) {
  switch (tokenWarningLevel) {
    case TokenWarningLevel.LOW:
      return 'accentWarning'
    case TokenWarningLevel.MEDIUM:
      return 'accentCritical'
    case TokenWarningLevel.BLOCKED:
      return 'textSecondary'
    default:
      return 'textSecondary'
  }
}

export function useDismissTokenWarnings(): [
  {
    [chainId: number]: {
      [address: string]: boolean
    }
  },
  (currency: Currency) => void
] {
  const dispatch = useAppDispatch()
  const dismissedTokens = useAppSelector(dismissedWarningTokensSelector)
  const dismissWarning = useCallback(
    (currency: Currency) => {
      if (currency.wrapped.chainId && currency.wrapped.address) {
        dispatch(
          addDismissedWarningToken({
            address: currency.wrapped.address,
            chainId: currency.wrapped.chainId,
          })
        )
      }
    },
    [dispatch]
  )

  return [dismissedTokens, dismissWarning]
}
