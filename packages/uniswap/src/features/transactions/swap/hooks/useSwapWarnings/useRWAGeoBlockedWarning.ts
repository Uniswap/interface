import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useIsRWAGeoBlocked } from 'uniswap/src/features/rwa/useIsRWAGeoBlocked'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

/**
 * Real-world assets (RWAs) are not tradable when the `rwa_geo_blocked` gate is enabled, so swapping
 * into or out of an RWA gets a blocking warning that disables the swap review button.
 */
export function useRWAGeoBlockedWarning(currencies: DerivedSwapInfo['currencies']): Warning | undefined {
  const { t } = useTranslation()
  const inputCurrency = currencies[CurrencyField.INPUT]?.currency
  const outputCurrency = currencies[CurrencyField.OUTPUT]?.currency

  const isInputRWAGeoBlocked = useIsRWAGeoBlocked(inputCurrency)
  const isOutputRWAGeoBlocked = useIsRWAGeoBlocked(outputCurrency)

  return useMemo(() => {
    if (!isInputRWAGeoBlocked && !isOutputRWAGeoBlocked) {
      return undefined
    }

    return {
      type: WarningLabel.RWAGeoBlocked,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: t('swap.warning.rwaGeoBlocked.button'),
    }
  }, [isInputRWAGeoBlocked, isOutputRWAGeoBlocked, t])
}
