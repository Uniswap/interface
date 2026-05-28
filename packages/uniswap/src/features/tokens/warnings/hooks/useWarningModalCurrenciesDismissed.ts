import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getTokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'

// Handle if user has previously dismissed a warning for either token
export function useWarningModalCurrenciesDismissed({
  t0,
  t1,
  isInfoOnlyWarning,
}: {
  t0: CurrencyInfo
  t1?: CurrencyInfo
  isInfoOnlyWarning?: boolean
}): {
  currencyInfo0: CurrencyInfo
  onDismissTokenWarning0: () => void
  currencyInfo1?: CurrencyInfo
  onDismissTokenWarning1: () => void | undefined
} | null {
  const address0 = currencyIdToAddress(t0.currencyId)
  const tokenProtectionWarning0 = getTokenProtectionWarning(t0)
  const { tokenWarningDismissed: tokenWarningDismissed0, onDismissTokenWarning: onDismissTokenWarning0 } =
    useDismissedTokenWarnings(
      t0.currency.isNative ? undefined : { chainId: t0.currency.chainId, address: address0 },
      tokenProtectionWarning0,
    )

  const address1 = t1 && currencyIdToAddress(t1.currencyId)
  const tokenProtectionWarning1 = getTokenProtectionWarning(t1)
  const { tokenWarningDismissed: tokenWarningDismissed1, onDismissTokenWarning: onDismissTokenWarning1 } =
    useDismissedTokenWarnings(
      !t1 || !address1 || t1.currency.isNative ? undefined : { chainId: t1.currency.chainId, address: address1 },
      tokenProtectionWarning1,
    )

  const dismissFunctions = {
    onDismissTokenWarning0,
    onDismissTokenWarning1,
  }

  // Info warning should show regardless of dismissal status
  // If neither token is dismissed, return both warnings
  if (isInfoOnlyWarning || (!tokenWarningDismissed0 && !tokenWarningDismissed1)) {
    return { currencyInfo0: t0, currencyInfo1: t1, ...dismissFunctions }
  }

  // Token 1 not dismissed and present
  if (!tokenWarningDismissed1 && t1) {
    return { currencyInfo0: t1, ...dismissFunctions }
  }

  // Token 0 not dismissed
  if (!tokenWarningDismissed0) {
    return { currencyInfo0: t0, ...dismissFunctions }
  }

  // If all present tokens are dismissed, return null
  return null
}
