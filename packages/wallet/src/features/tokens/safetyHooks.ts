import { useCallback } from 'react'
import { CurrencyId } from 'uniswap/src/types/currency'
import { dismissedWarningTokensSelector } from 'wallet/src/features/tokens/dismissedWarningTokensSelector'
import { addDismissedWarningToken } from 'wallet/src/features/tokens/tokensSlice'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'

export function useTokenWarningDismissed(currencyId: Maybe<CurrencyId>): {
  tokenWarningDismissed: boolean // user dismissed warning
  dismissWarningCallback: () => void // callback to dismiss warning
} {
  const dispatch = useAppDispatch()
  const dismissedTokens = useAppSelector(dismissedWarningTokensSelector)

  const tokenWarningDismissed = Boolean(currencyId && dismissedTokens && dismissedTokens[currencyId])

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
