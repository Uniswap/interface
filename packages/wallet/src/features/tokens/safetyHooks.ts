import { useCallback } from 'react'
import { ThemeKeys } from 'ui/src'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { dismissedWarningTokensSelector } from 'wallet/src/features/tokens/dismissedWarningTokensSelector'
import { addDismissedWarningToken } from 'wallet/src/features/tokens/tokensSlice'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'
import { CurrencyId } from 'wallet/src/utils/currencyId'

export function useTokenWarningDismissed(currencyId: Maybe<CurrencyId>): {
  tokenWarningDismissed: boolean // user dismissed warning
  dismissWarningCallback: () => void // callback to dismiss warning
} {
  const dispatch = useAppDispatch()
  const dismissedTokens = useAppSelector(dismissedWarningTokensSelector)

  const tokenWarningDismissed = Boolean(
    currencyId && dismissedTokens && dismissedTokens[currencyId]
  )

  const dismissWarningCallback = useCallback(() => {
    if (currencyId) {
      dispatch(addDismissedWarningToken({ currencyId }))
    }
  }, [currencyId, dispatch])

  return {
    tokenWarningDismissed,
    dismissWarningCallback,
  }
}

export function useTokenSafetyLevelColors(safetyLevel: Maybe<SafetyLevel>): ThemeKeys {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return 'DEP_accentWarning'
    case SafetyLevel.StrongWarning:
      return 'statusCritical'
    case SafetyLevel.Blocked:
    default:
      return 'neutral2'
  }
}
