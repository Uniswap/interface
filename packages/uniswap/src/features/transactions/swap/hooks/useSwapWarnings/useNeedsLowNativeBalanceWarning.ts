import { useSelector } from 'react-redux'

import { selectHasDismissedLowNetworkTokenWarning } from 'uniswap/src/features/behaviorHistory/selectors'

import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

export function useNeedsLowNativeBalanceWarning({
  derivedSwapInfo,
  isMax,
}: {
  derivedSwapInfo: DerivedSwapInfo
  isMax: boolean
}): boolean {
  const needsLowNativeBalanceWarning = isMax && derivedSwapInfo.currencyAmounts[CurrencyField.INPUT]?.currency.isNative
  const hasDismissedLowNetworkTokenWarning = useSelector(selectHasDismissedLowNetworkTokenWarning)
  return !!needsLowNativeBalanceWarning && !hasDismissedLowNetworkTokenWarning
}
