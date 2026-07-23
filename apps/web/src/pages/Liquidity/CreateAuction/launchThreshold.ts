import { type Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { type RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { getRaiseCurrencyAsCurrency } from '~/pages/Liquidity/CreateAuction/utils'

/**
 * Quotes a token amount in the raise currency at the given floor price (raise currency per auction
 * token). Returns `undefined` for an empty/zero floor price or a zero token amount.
 */
export function quoteRaiseAtFloor({
  floorPrice,
  raiseCurrency,
  chainId,
  tokensAmount,
}: {
  floorPrice: string
  raiseCurrency: RaiseCurrency
  chainId: UniverseChainId
  tokensAmount: CurrencyAmount<Currency>
}): CurrencyAmount<Currency> | undefined {
  const raiseSdk = getRaiseCurrencyAsCurrency(raiseCurrency, chainId)
  const trimmedFloor = floorPrice.trim()
  if (!raiseSdk || !trimmedFloor || tokensAmount.equalTo(0)) {
    return undefined
  }

  const quotePerToken = getCurrencyAmount({ value: trimmedFloor, valueType: ValueType.Exact, currency: raiseSdk })
  if (!quotePerToken || quotePerToken.equalTo(0)) {
    return undefined
  }

  const auctionToken = tokensAmount.currency
  const oneAuctionToken = CurrencyAmount.fromRawAmount(auctionToken, (10n ** BigInt(auctionToken.decimals)).toString())
  try {
    return new Price({ baseAmount: oneAuctionToken, quoteAmount: quotePerToken }).quote(tokensAmount)
  } catch {
    return undefined
  }
}

/**
 * Launch threshold: the minimum raise-currency bid volume required for the auction to launch — the
 * floor price times the number of tokens being sold (deposit minus the LP token reserve; both the
 * fundraise leg and the raise-side LP leg are sold to bidders). Returns `undefined` when the floor
 * price is unset or no tokens are sold.
 */
export function getLaunchThreshold({
  floorPrice,
  raiseCurrency,
  chainId,
  auctionSupplyAmount,
  postAuctionLiquidityAmount,
}: {
  floorPrice: string
  raiseCurrency: RaiseCurrency
  chainId: UniverseChainId
  auctionSupplyAmount: CurrencyAmount<Currency>
  postAuctionLiquidityAmount: CurrencyAmount<Currency>
}): CurrencyAmount<Currency> | undefined {
  const soldAmount = auctionSupplyAmount.subtract(postAuctionLiquidityAmount)
  return quoteRaiseAtFloor({ floorPrice, raiseCurrency, chainId, tokensAmount: soldAmount })
}
