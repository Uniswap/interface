import { FetchError } from '@universe/api'
import type { TFunction } from 'i18next'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParsedWarnings, Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { useTransactionGasWarning } from 'uniswap/src/features/gas/hooks'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useActiveSwapPermissionedState } from 'uniswap/src/features/permissionedTokens/useActiveSwapPermissionedState'
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
import { getPermissionedPoolWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPermissionedPoolWarning'
import { getPriceDifferenceWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPriceDifferenceWarning'
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
import { getPriceDifference } from 'uniswap/src/features/transactions/swap/utils/getPriceDifference'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { logger } from 'utilities/src/logger/logger'
import { useMemoCompare } from 'utilities/src/react/hooks'
import { useStore } from 'zustand'

export function getSwapWarnings({
  t,
  formatPercent,
  derivedSwapInfo,
  offline,
  geoRestrictionMode,
  geoRestrictedTokenSymbol,
  isPermissioned = false,
  isAllowlisted = true,
}: {
  t: TFunction
  formatPercent: LocalizationContextState['formatPercent']
  derivedSwapInfo: DerivedSwapInfo
  offline: boolean
  geoRestrictionMode: GeoRestrictionMode
  geoRestrictedTokenSymbol?: string
  isPermissioned?: boolean
  isAllowlisted?: boolean
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

  // permissioned pool — user not on allowlist
  const permissionedWarning = getPermissionedPoolWarning({ t, isPermissioned, isAllowlisted })
  if (permissionedWarning) {
    warnings.push(permissionedWarning)
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
    // Anomaly telemetry: an unstructured 403 from /quote should only happen when the user is
    // blocked by a permissioned pool. If we received one but `permissionedWarning` is undefined
    // (token not permissioned or already allowlisted), the BE state disagrees with our local
    // state — surface for investigation. Fires regardless of whether we end up pushing an error
    // warning below.
    if (
      !permissionedWarning &&
      trade.error instanceof FetchError &&
      trade.error.response.status === 403 &&
      trade.error.data?.errorCode === undefined
    ) {
      logger.warn(
        'TradingApi',
        'useSwapWarnings',
        '403 received but user is not blockable (non-permissioned token or already allowlisted); investigate cause',
        {
          chainId:
            derivedSwapInfo.currencies.input?.currency.chainId ?? derivedSwapInfo.currencies.output?.currency.chainId,
        },
      )
    }

    // Skip the generic error warning when the permissioned-pool warning is already covering this
    // blocked state — the 403 from /quote is consistent with it and a second entry is noise.
    if (!permissionedWarning) {
      const errorWarning = getSwapWarningFromError({ error: trade.error, t, derivedSwapInfo })
      warnings.push(errorWarning)
    }
  }

  // swap form is missing input, output fields
  const formIncompleteWarning = getFormIncompleteWarning(derivedSwapInfo)
  if (formIncompleteWarning) {
    warnings.push(formIncompleteWarning)
  }

  // price difference warning
  const priceDifference = getPriceDifference(derivedSwapInfo)
  const priceImpactWarning = getPriceDifferenceWarning({
    t,
    priceDifference,
    routing: trade.trade?.routing,
    formatPercent,
  })
  if (priceImpactWarning) {
    warnings.push(priceImpactWarning)
  }

  return warnings
}

function useSwapWarnings({
  derivedSwapInfo,
  isPermissioned,
  isAllowlisted,
}: {
  derivedSwapInfo: DerivedSwapInfo
  isPermissioned: boolean
  isAllowlisted: boolean
}): Warning[] {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const offline = useIsOffline()
  const geoRestrictionMode = useGeoRestrictionMode()
  const geoRestrictedTokenSymbol = useGeoRestrictedTokenSymbol()

  return useMemoCompare(
    () =>
      getSwapWarnings({
        t,
        formatPercent,
        derivedSwapInfo,
        offline,
        geoRestrictionMode,
        geoRestrictedTokenSymbol,
        isPermissioned,
        isAllowlisted,
      }),
    isEqual,
  )
}

function useParsedSwapFormWarnings(): ParsedWarnings {
  const { t } = useTranslation()
  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)

  const accountAddress = useActiveAddress(derivedSwapInfo.chainId)

  const gasFee = useSwapTxStore((s) => s.gasFee)
  const isGasSponsored = useSwapTxStore((s) => isSponsorableSwap(s) && s.trade?.quote.sponsorshipInfo?.sponsored)

  // useActiveSwapPermissionedState resolves the wallet via chainIdToPlatform so
  // non-EVM permissioned tokens read the right address; useActiveAddress here is
  // EVM-only and used elsewhere in this hook for gas warnings.
  const { isPermissioned, isAllowlisted } = useActiveSwapPermissionedState()

  const swapWarnings = useSwapWarnings({ derivedSwapInfo, isPermissioned, isAllowlisted })

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
