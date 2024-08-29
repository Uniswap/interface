import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { dismissedWarningTokensSelector } from 'uniswap/src/features/tokens/slice/selectors'
import { addDismissedWarningToken } from 'uniswap/src/features/tokens/slice/slice'
import { CurrencyId } from 'uniswap/src/types/currency'

export function useTokenWarningDismissed(currencyId: Maybe<CurrencyId>): {
  tokenWarningDismissed: boolean // user dismissed warning
  dismissWarningCallback: () => void // callback to dismiss warning
} {
  const dispatch = useDispatch()
  const dismissedTokens = useSelector(dismissedWarningTokensSelector)

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
