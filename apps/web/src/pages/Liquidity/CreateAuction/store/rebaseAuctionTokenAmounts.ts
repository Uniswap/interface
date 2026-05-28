import { type Currency, CurrencyAmount } from '@uniswap/sdk-core'
import type { AuctionTokenAmounts } from '~/pages/Liquidity/CreateAuction/types'

/**
 * Re-wrap existing committed amounts with a new token, preserving raw values.
 * Used when only the token metadata (name/symbol) changed but the supply didn't.
 */
export function rebaseAuctionTokenAmounts(committed: AuctionTokenAmounts, newToken: Currency): AuctionTokenAmounts {
  return {
    totalSupply: CurrencyAmount.fromRawAmount(newToken, committed.totalSupply.quotient),
    auctionSupplyAmount: CurrencyAmount.fromRawAmount(newToken, committed.auctionSupplyAmount.quotient),
    postAuctionLiquidityAmount: CurrencyAmount.fromRawAmount(newToken, committed.postAuctionLiquidityAmount.quotient),
  }
}
