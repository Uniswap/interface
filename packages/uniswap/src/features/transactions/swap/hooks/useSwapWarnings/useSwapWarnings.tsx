import type { TFunction } from 'i18next'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParsedWarnings, Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { useTransactionGasWarning } from 'uniswap/src/features/gas/hooks'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  getNetworkWarning,
  useFormattedWarnings,
} from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'
import {
  type GeoRestrictionMode,
  useGeoRestrictedTokenSymbol,
  useGeoRestrictionMode,
} from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'
import { getBalanceWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getBalanceWarning'
import { getFormIncompleteWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getFormIncompleteWarning'
import { getGeoRestrictionWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getGeoRestrictionWarning'
import { getPriceImpactWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPriceImpactWarning'
import {
  getSwapWarningFromError,
  isGasSponsorshipFailureError,
} from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getSwapWarningFromError'
import { getTokenBlockedWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning'
import { useParsedActivePlanWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useParsedActivePlanWarnings'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isSponsorableSwap } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { getPriceImpact } from 'uniswap/src/features/transactions/swap/utils/getPriceImpact'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { useMemoCompare } from 'utilities/src/react/hooks'
import { useStore } from 'zustand'

export function getSwapWarnings({
  t,
  formatPercent,
  derivedSwapInfo,
  offline,
  geoRestrictionMode,
  geoRestrictedTokenSymbol,
}: {
  t: TFunction
  formatPercent: LocalizationContextState['formatPercent']
  derivedSwapInfo: DerivedSwapInfo
  offline: boolean
  geoRestrictionMode: GeoRestrictionMode
  geoRestrictedTokenSymbol?: string
}): Warning[] {
  const warnings: Warning[] = []

  if (offline) {
    warnings.push(getNetworkWarning(t))
  }

  const { trade } = derivedSwapInfo

  // pushed before the generic token-blocked warning so its more specific CTA wins
  const geoRestrictionWarning = getGeoRestrictionWarning({
    t,
    mode: geoRestrictionMode,
    tokenSymbol: geoRestrictedTokenSymbol,
  })
  if (geoRestrictionWarning) {
    warnings.push(geoRestrictionWarning)
  }

  const tokenBlockedWarning = getTokenBlockedWarning(t, derivedSwapInfo.currencies)
  if (tokenBlockedWarning) {
    warnings.push(tokenBlockedWarning)
  }

  // insufficient balance for swap
  const balanceWarning = getBalanceWarning({
    t,
    currencyBalances: derivedSwapInfo.currencyBalances,
    currencyAmounts: derivedSwapInfo.currencyAmounts,
  })
  if (balanceWarning) {
    warnings.push(balanceWarning)
  }

  if (trade.error) {
    warnings.push(getSwapWarningFromError({ error: trade.error, t, derivedSwapInfo }))
  }

  // swap form is missing input, output fields
  const formIncompleteWarning = getFormIncompleteWarning(derivedSwapInfo)
  if (formIncompleteWarning) {
    warnings.push(formIncompleteWarning)
  }

  // price impact warning
  const priceImpact = getPriceImpact(derivedSwapInfo)
  const priceImpactWarning = getPriceImpactWarning({
    t,
    priceImpact,
    formatPercent,
  })
  if (priceImpactWarning) {
    warnings.push(priceImpactWarning)
  }

  return warnings
}

function useSwapWarnings(derivedSwapInfo: DerivedSwapInfo): Warning[] {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const offline = useIsOffline()
  const geoRestrictionMode = useGeoRestrictionMode()
  const geoRestrictedTokenSymbol = useGeoRestrictedTokenSymbol()

  return useMemoCompare(
    () => getSwapWarnings({ t, formatPercent, derivedSwapInfo, offline, geoRestrictionMode, geoRestrictedTokenSymbol }),
    isEqual,
  )
}

function useParsedSwapFormWarnings(): ParsedWarnings {
  const { t } = useTranslation()
  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)

  const accountAddress = useActiveAddress(derivedSwapInfo.chainId)

  const gasFee = useSwapTxStore((s) => s.gasFee)
  const isGasSponsored = useSwapTxStore((s) => isSponsorableSwap(s) && s.trade?.quote.sponsorshipInfo?.sponsored)

  const swapWarnings = useSwapWarnings(derivedSwapInfo)

  const gasWarning = useTransactionGasWarning({
    accountAddress,
    derivedInfo: derivedSwapInfo,
    gasFee: gasFee.value,
    isGasSponsored,
  })

  const sponsorshipWarning = useMemo(
    () =>
      gasFee.error && isGasSponsorshipFailureError(gasFee.error)
        ? getSwapWarningFromError({ error: gasFee.error, t, derivedSwapInfo })
        : undefined,
    [gasFee.error, t, derivedSwapInfo],
  )

  const allWarnings = useMemo(() => {
    return [...swapWarnings, gasWarning, sponsorshipWarning].filter((w): w is Warning => !!w)
  }, [gasWarning, swapWarnings, sponsorshipWarning])

  return useFormattedWarnings(allWarnings)
}

export function useParsedSwapWarnings(): ParsedWarnings {
  const hasActivePlan = useStore(activePlanStore, (s) => !!s.activePlan)

  const formWarnings = useParsedSwapFormWarnings()
  const planWarnings = useParsedActivePlanWarnings()

  return hasActivePlan ? planWarnings : formWarnings
}
