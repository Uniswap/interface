import { Currency, CurrencyAmount, Price, SupportedChainId, TradeType } from '@uniswap/sdk-core'
import { nativeOnChain } from 'constants/tokens'
import { Chain, useTokenSpotPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName, isGqlSupportedChain, PollingInterval } from 'graphql/data/util'
import { RouterPreference } from 'state/routing/slice'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

import useStablecoinPrice from './useStablecoinPrice'

// ETH amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
const ETH_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Currency> } = {
  [SupportedChainId.MAINNET]: CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.MAINNET), 100),
  [SupportedChainId.ARBITRUM_ONE]: CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.ARBITRUM_ONE), 100),
  [SupportedChainId.OPTIMISM]: CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.OPTIMISM), 100),
  [SupportedChainId.POLYGON]: CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.POLYGON), 10_000e6),
}

function useETHValue(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  const chainId = currencyAmount?.currency?.chainId
  const amountOut = isGqlSupportedChain(chainId) ? ETH_AMOUNT_OUT[chainId] : undefined
  const { trade } = useRoutingAPITrade(
    TradeType.EXACT_OUTPUT,
    amountOut,
    currencyAmount?.currency,
    RouterPreference.PRICE
  )

  if (chainId && currencyAmount && currencyAmount.currency.equals(nativeOnChain(chainId))) {
    return new Price(currencyAmount.currency, currencyAmount.currency, '1', '1').quote(currencyAmount)
  }

  if (!trade || !currencyAmount?.currency || !isGqlSupportedChain(chainId)) return

  const { numerator, denominator } = trade.routes[0].midPrice
  const price = new Price(currencyAmount?.currency, nativeOnChain(chainId), denominator, numerator)
  return price.quote(currencyAmount)
}

export function useUSDPrice(currencyAmount?: CurrencyAmount<Currency>): number | undefined {
  const chain = currencyAmount?.currency.chainId ? chainIdToBackendName(currencyAmount?.currency.chainId) : undefined
  const currency = currencyAmount?.currency
  const ethValue = useETHValue(currencyAmount)

  const { data } = useTokenSpotPriceQuery({
    variables: { chain: chain ?? Chain.Ethereum, address: getNativeTokenDBAddress(chain ?? Chain.Ethereum) },
    skip: !chain || !isGqlSupportedChain(currency?.chainId),
    pollInterval: PollingInterval.Normal,
  })

  // Use USDC price for chains not supported by backend yet
  const stablecoinPrice = useStablecoinPrice(!isGqlSupportedChain(currency?.chainId) ? currency : undefined)
  if (!isGqlSupportedChain(currency?.chainId) && currencyAmount && stablecoinPrice) {
    return parseFloat(stablecoinPrice.quote(currencyAmount).toSignificant())
  }

  // Otherwise, get the price of the token in ETH, and then multiple by the price of ETH
  const ethUSDPrice = data?.token?.project?.markets?.[0]?.price?.value
  if (!ethUSDPrice || !ethValue) return undefined

  return parseFloat(ethValue.toExact()) * ethUSDPrice
}
