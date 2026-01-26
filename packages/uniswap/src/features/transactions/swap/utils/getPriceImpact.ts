import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'

// HKSWAP: Simplified - HashKey chains only support Classic trades (no UniswapX, no Jupiter/Solana)
export function getPriceImpact(derivedSwapInfo: DerivedSwapInfo): Percent | undefined {
  const trade = derivedSwapInfo.trade.trade
  if (!trade || !isClassic(trade)) {
    return undefined
  }

  return trade.priceImpact
}
