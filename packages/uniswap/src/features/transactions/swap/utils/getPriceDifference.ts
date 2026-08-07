import type { Percent } from '@uniswap/sdk-core'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'

export function getPriceDifference(derivedSwapInfo: DerivedSwapInfo): Percent | undefined {
  return derivedSwapInfo.trade.trade?.priceDifference
}
