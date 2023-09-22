import { NetworkStatus } from '@apollo/client'
import { ChainId, Currency, CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import { nativeOnChain } from 'constants/tokens'
import { Chain, useTokenSpotPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName, isGqlSupportedChain, PollingInterval } from 'graphql/data/util'
import { useMemo } from 'react'
import { INTERNAL_ROUTER_PREFERENCE_PRICE, TradeState } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

import useStablecoinPrice from './useStablecoinPrice'

// ETH amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
const ETH_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Currency> } = {
  [ChainId.MAINNET]: CurrencyAmount.fromRawAmount(nativeOnChain(ChainId.MAINNET), 50e18),
  [ChainId.ARBITRUM_ONE]: CurrencyAmount.fromRawAmount(nativeOnChain(ChainId.ARBITRUM_ONE), 10e18),
  [ChainId.OPTIMISM]: CurrencyAmount.fromRawAmount(nativeOnChain(ChainId.OPTIMISM), 10e18),
  [ChainId.POLYGON]: CurrencyAmount.fromRawAmount(nativeOnChain(ChainId.POLYGON), 10_000e18),
  [ChainId.CELO]: CurrencyAmount.fromRawAmount(nativeOnChain(ChainId.CELO), 10e18),
}

function useETHPrice(currency?: Currency): {
  data?: Price<Currency, Currency>
  isLoading: boolean
} {
  const chainId = currency?.chainId
  const isSupported = currency && isGqlSupportedChain(chainId)

  const amountOut = isSupported ? ETH_AMOUNT_OUT[chainId] : undefined
  const { trade, state } = useRoutingAPITrade(
    !isSupported /* skip */,
    TradeType.EXACT_OUTPUT,
    amountOut,
    currency,
    INTERNAL_ROUTER_PREFERENCE_PRICE
  )

  return useMemo(() => {
    if (!isSupported) {
      return { data: undefined, isLoading: false }
    }

    if (currency?.wrapped.equals(nativeOnChain(chainId).wrapped)) {
      return {
        data: new Price(currency, currency, '1', '1'),
        isLoading: false,
      }
    }

    if (!trade || state === TradeState.LOADING) {
      return { data: undefined, isLoading: state === TradeState.LOADING }
    }

    const { numerator, denominator } = trade.routes[0].midPrice
    const price = new Price(currency, nativeOnChain(chainId), denominator, numerator)
    return { data: price, isLoading: false }
  }, [chainId, currency, isSupported, state, trade])
}

export function useUSDPrice(
  currencyAmount?: CurrencyAmount<Currency>,
  prefetchCurrency?: Currency
): {
  data?: number
  isLoading: boolean
} {
  const currency = currencyAmount?.currency ?? prefetchCurrency
  const chainId = currency?.chainId
  const chain = chainId ? chainIdToBackendName(chainId) : undefined

  // Use ETH-based pricing if available.
  const { data: tokenEthPrice, isLoading: isTokenEthPriceLoading } = useETHPrice(currency)
  const isTokenEthPriced = Boolean(tokenEthPrice || isTokenEthPriceLoading)
  const { data, networkStatus } = useTokenSpotPriceQuery({
    variables: { chain: chain ?? Chain.Ethereum, address: getNativeTokenDBAddress(chain ?? Chain.Ethereum) },
    skip: !isTokenEthPriced,
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-first',
  })

  // Use USDC-based pricing for chains not yet supported by backend (for ETH-based pricing).
  const stablecoinPrice = useStablecoinPrice(isTokenEthPriced ? undefined : currency)

  return useMemo(() => {
    if (!currencyAmount) {
      return { data: undefined, isLoading: false }
    } else if (stablecoinPrice) {
      return { data: parseFloat(stablecoinPrice.quote(currencyAmount).toSignificant()), isLoading: false }
    } else {
      // Otherwise, get the price of the token in ETH, and then multiply by the price of ETH.
      const ethUSDPrice = data?.token?.project?.markets?.[0]?.price?.value
      if (ethUSDPrice && tokenEthPrice) {
        return { data: parseFloat(tokenEthPrice.quote(currencyAmount).toExact()) * ethUSDPrice, isLoading: false }
      } else {
        return { data: undefined, isLoading: isTokenEthPriceLoading || networkStatus === NetworkStatus.loading }
      }
    }
  }, [
    currencyAmount,
    data?.token?.project?.markets,
    tokenEthPrice,
    isTokenEthPriceLoading,
    networkStatus,
    stablecoinPrice,
  ])
}
