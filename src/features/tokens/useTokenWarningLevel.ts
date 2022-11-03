import { Currency } from '@uniswap/sdk-core'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { SafetyLevel } from 'src/data/__generated__/types-and-hooks'
import {
  addDismissedWarningToken,
  dismissedWarningTokensSelector,
} from 'src/features/tokens/tokensSlice'
import { toSupportedChainId } from 'src/utils/chainId'

export function useTokenWarningLevel(currency: Currency): {
  tokenWarningDismissed: boolean // user dismissed warning
  warningDismissCallback: () => void // callback to dismiss warning
} {
  const chainId = toSupportedChainId(currency?.chainId)

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
    tokenWarningDismissed,
    warningDismissCallback,
  }
}

export function useTokenSafetyLevelColors(safetyLevel: NullUndefined<SafetyLevel>) {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return 'accentWarning'
    case SafetyLevel.StrongWarning:
      return 'accentCritical'
    case SafetyLevel.Blocked:
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
