import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { SafetyLevel } from 'src/data/__generated__/types-and-hooks'
import {
  addDismissedWarningToken,
  dismissedWarningTokensSelector,
} from 'src/features/tokens/tokensSlice'
import { Theme } from 'src/styles/theme'
import { CurrencyId } from 'src/utils/currencyId'

export function useTokenWarningDismissed(currencyId: NullUndefined<CurrencyId>): {
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

export function useTokenSafetyLevelColors(
  safetyLevel: NullUndefined<SafetyLevel>
): keyof Theme['colors'] {
  switch (safetyLevel) {
    case SafetyLevel.MediumWarning:
      return 'accentWarning'
    case SafetyLevel.StrongWarning:
      return 'accentCritical'
    case SafetyLevel.Blocked:
    default:
      return 'textSecondary'
  }
}
