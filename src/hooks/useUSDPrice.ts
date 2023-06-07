import { NetworkStatus } from '@apollo/client'
import { Currency, CurrencyAmount, Price, SupportedChainId, TradeType } from '@uniswap/sdk-core'
import { nativeOnChain } from 'constants/tokens'
import { Chain, useTokenSpotPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName, isGqlSupportedChain, PollingInterval } from 'graphql/data/util'
import { INTERNAL_ROUTER_PREFERENCE_PRICE } from 'state/routing/slice'
import { TradeState } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

import useStablecoinPrice from './useStablecoinPrice'

// ETH amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
const ETH_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Currency> } = {
  [SupportedChainId.MAINNET]: CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.MAINNET), 50e18),
  [SupportedChainId.ARBITRUM_ONE]: CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.ARBITRUM_ONE), 10e18),
  [SupportedChainId.OPTIMISM]: CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.OPTIMISM), 10e18),
  [SupportedChainId.POLYGON]: CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.POLYGON), 10_000e18),
  [SupportedChainId.CELO]: CurrencyAmount.fromRawAmount(nativeOnChain(SupportedChainId.CELO), 10e18),
}

function useETHValue(currencyAmount?: CurrencyAmount<Currency>): {
  data?: CurrencyAmount<Currency>
  isLoading: boolean
} {
  const chainId = currencyAmount?.currency?.chainId
  const amountOut = isGqlSupportedChain(chainId) ? ETH_AMOUNT_OUT[chainId] : undefined
  const { trade, state } = useRoutingAPITrade(
    TradeType.EXACT_OUTPUT,
    amountOut,
    currencyAmount?.currency,
    INTERNAL_ROUTER_PREFERENCE_PRICE
  )

  // Get ETH value of ETH or WETH
  if (chainId && currencyAmount && currencyAmount.currency.wrapped.equals(nativeOnChain(chainId).wrapped)) {
    return {
      data: new Price(currencyAmount.currency, currencyAmount.currency, '1', '1').quote(currencyAmount),
      isLoading: false,
    }
  }

  if (!trade || state === TradeState.LOADING || !currencyAmount?.currency || !isGqlSupportedChain(chainId)) {
    return { data: undefined, isLoading: state === TradeState.LOADING }
  }

  const { numerator, denominator } = trade.routes[0].midPrice
  const price = new Price(currencyAmount?.currency, nativeOnChain(chainId), denominator, numerator)
  return { data: price.quote(currencyAmount), isLoading: false }
}

// TODO(WEB-2095): This hook should early return `null` when `currencyAmount` is undefined. Otherwise,
// it is not possible to differentiate between a loading state and a state where `currencyAmount`
// is undefined
export function useUSDPrice(currencyAmount?: CurrencyAmount<Currency>): {
  data?: number
  isLoading: boolean
} {
  const chain = currencyAmount?.currency.chainId ? chainIdToBackendName(currencyAmount?.currency.chainId) : undefined
  const currency = currencyAmount?.currency
  const { data: ethValue, isLoading: isEthValueLoading } = useETHValue(currencyAmount)

  const { data, networkStatus } = useTokenSpotPriceQuery({
    variables: { chain: chain ?? Chain.Ethereum, address: getNativeTokenDBAddress(chain ?? Chain.Ethereum) },
    skip: !chain || !isGqlSupportedChain(currency?.chainId),
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-first',
  })

  // Use USDC price for chains not supported by backend yet
  const stablecoinPrice = useStablecoinPrice(!isGqlSupportedChain(currency?.chainId) ? currency : undefined)
  if (!isGqlSupportedChain(currency?.chainId) && currencyAmount && stablecoinPrice) {
    return { data: parseFloat(stablecoinPrice.quote(currencyAmount).toSignificant()), isLoading: false }
  }

  const isFirstLoad = networkStatus === NetworkStatus.loading

  // Otherwise, get the price of the token in ETH, and then multiple by the price of ETH
  const ethUSDPrice = data?.token?.project?.markets?.[0]?.price?.value
  if (!ethUSDPrice || !ethValue) return { data: undefined, isLoading: isEthValueLoading || isFirstLoad }

  return { data: parseFloat(ethValue.toExact()) * ethUSDPrice, isLoading: false }
}
