import { TFunction } from 'i18next'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ParsedWarnings, Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useTransactionGasWarning } from 'uniswap/src/features/gas/hooks'
import { LocalizationContextState, useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  getNetworkWarning,
  useFormattedWarnings,
} from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { getBalanceWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getBalanceWarning'
import { getFormIncompleteWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getFormIncompleteWarning'
import { getPriceImpactWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPriceImpactWarning'
import { getSwapWarningFromError } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getSwapWarningFromError'
import { getTokenBlockedWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getPriceImpact } from 'uniswap/src/features/transactions/swap/utils/getPriceImpact'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { useMemoCompare } from 'utilities/src/react/hooks'

export function getSwapWarnings({
  t,
  formatPercent,
  derivedSwapInfo,
  offline,
}: {
  t: TFunction
  formatPercent: LocalizationContextState['formatPercent']
  derivedSwapInfo: DerivedSwapInfo
  offline: boolean
}): Warning[] {
  const warnings: Warning[] = []

  if (offline) {
    warnings.push(getNetworkWarning(t))
  }

  const { trade } = derivedSwapInfo

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

  return useMemoCompare(() => getSwapWarnings({ t, formatPercent, derivedSwapInfo, offline }), isEqual)
}

export function useParsedSwapWarnings(): ParsedWarnings {
  const account = useAccountMeta()
  const { derivedSwapInfo } = useSwapFormContext()
  const { gasFee } = useSwapTxContext()

  const swapWarnings = useSwapWarnings(derivedSwapInfo)

  const gasWarning = useTransactionGasWarning({ account, derivedInfo: derivedSwapInfo, gasFee: gasFee.value })

  const allWarnings = useMemo(() => {
    return !gasWarning ? swapWarnings : [...swapWarnings, gasWarning]
  }, [gasWarning, swapWarnings])

  return useFormattedWarnings(allWarnings)
}
