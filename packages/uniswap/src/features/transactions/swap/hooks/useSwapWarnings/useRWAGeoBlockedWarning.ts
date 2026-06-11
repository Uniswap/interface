import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import { useRWAMatch } from 'uniswap/src/features/rwa/useRWAMatch'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

/**
 * Real-world assets (RWAs) are not tradable when the `rwa_geo_blocked` gate is enabled, so swapping
 * into or out of an RWA gets a blocking warning that disables the swap review button.
 */
export function useRWAGeoBlockedWarning(currencies: DerivedSwapInfo['currencies']): Warning | undefined {
  const { t } = useTranslation()
  const isGeoblockEnabled = useFeatureFlag(FeatureFlags.RwaGeoblocked)

  const candidates = useMemo(() => {
    if (!isGeoblockEnabled) {
      return []
    }
    return [currencies[CurrencyField.INPUT], currencies[CurrencyField.OUTPUT]]
      .filter((currencyInfo): currencyInfo is CurrencyInfo => Boolean(currencyInfo))
      .flatMap((currencyInfo) => getRWACandidatesFromCurrency(currencyInfo.currency))
  }, [isGeoblockEnabled, currencies])

  const rwaMatch = useRWAMatch({ candidates, enabled: isGeoblockEnabled && candidates.length > 0 })

  return useMemo(() => {
    if (!isGeoblockEnabled || !rwaMatch) {
      return undefined
    }
    return {
      type: WarningLabel.RWAGeoBlocked,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: t('swap.warning.rwaGeoBlocked.button'),
    }
  }, [isGeoblockEnabled, rwaMatch, t])
}
