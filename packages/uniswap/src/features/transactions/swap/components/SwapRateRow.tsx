import { RateRow } from '@universe/swap-ui'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useSwapRateDisplay } from 'uniswap/src/features/transactions/swap/hooks/useSwapRateDisplay'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'

/**
 * Adapter for the review details "Rate" line. Stays a component (not a value computed by the
 * parent) so useUSDCValue keeps mounting lazily inside TransactionDetails' RateInfo opening.
 */
export function SwapRateRow({
  trade,
  derivedSwapInfo,
}: {
  trade: Trade | IndicativeTrade
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
}): JSX.Element | null {
  const rate = useSwapRateDisplay({ trade, derivedSwapInfo })

  if (!rate) {
    return null
  }

  return <RateRow rate={rate} />
}
