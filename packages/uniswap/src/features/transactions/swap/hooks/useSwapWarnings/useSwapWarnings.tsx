import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { TFunction } from 'i18next'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ParsedWarnings, Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { useTransactionGasWarning } from 'uniswap/src/features/gas/hooks'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  getNetworkWarning,
  useFormattedWarnings,
} from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'
import { getAztecUnavailableWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getAztecUnavailableWarning'
import { getBalanceWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getBalanceWarning'
import { getFormIncompleteWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getFormIncompleteWarning'
import { getPriceImpactWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPriceImpactWarning'
import { getSwapWarningFromError } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getSwapWarningFromError'
import { getTokenBlockedWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getPriceImpact } from 'uniswap/src/features/transactions/swap/utils/getPriceImpact'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { useMemoCompare } from 'utilities/src/react/hooks'

export function getSwapWarnings({
  t,
  formatPercent,
  derivedSwapInfo,
  offline,
  aztecDisabled = false,
}: {
  t: TFunction
  formatPercent: LocalizationContextState['formatPercent']
  derivedSwapInfo: DerivedSwapInfo
  offline: boolean
  aztecDisabled?: boolean
}): Warning[] {
  const warnings: Warning[] = []

  if (offline) {
    warnings.push(getNetworkWarning(t))
  }

  const { trade } = derivedSwapInfo

  const aztecUnavailableWarning = getAztecUnavailableWarning({
    t,
    currencies: derivedSwapInfo.currencies,
    isAztecDisabled: aztecDisabled,
  })
  if (aztecUnavailableWarning) {
    warnings.push(aztecUnavailableWarning)
  }

  // token is blocked
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
    currencies: derivedSwapInfo.currencies,
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
  const aztecDisabled = useFeatureFlag(FeatureFlags.DisableAztecToken)

  return useMemoCompare(() => getSwapWarnings({ t, formatPercent, derivedSwapInfo, offline, aztecDisabled }), isEqual)
}

export function useParsedSwapWarnings(): ParsedWarnings {
  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)

  const accountAddress = useActiveAddress(derivedSwapInfo.chainId)

  const gasFee = useSwapTxStore((s) => s.gasFee)

  const swapWarnings = useSwapWarnings(derivedSwapInfo)

  // Check if current wallet can pay gas fees in any token
  const { getCanPayGasInAnyToken } = useUniswapContext()
  const skipGasCheck = getCanPayGasInAnyToken?.()

  const gasWarning = useTransactionGasWarning({
    accountAddress,
    derivedInfo: derivedSwapInfo,
    gasFee: gasFee.value,
    skipGasCheck,
  })

  const allWarnings = useMemo(() => {
    return !gasWarning ? swapWarnings : [...swapWarnings, gasWarning]
  }, [gasWarning, swapWarnings])

  return useFormattedWarnings(allWarnings)
}
