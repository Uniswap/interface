import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import {
  addDismissedWarningToken,
  dismissedWarningTokensSelector,
} from 'src/features/tokens/tokensSlice'
import { Theme } from 'ui/src/theme/restyle/theme'
import { SafetyLevel } from 'wallet/src/data/__generated__/types-and-hooks'
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

export function useTokenSafetyLevelColors(safetyLevel: Maybe<SafetyLevel>): keyof Theme['colors'] {
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
