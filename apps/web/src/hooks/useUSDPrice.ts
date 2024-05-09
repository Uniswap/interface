import { NetworkStatus } from '@apollo/client'
import { ChainId, Currency, CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import {
  SupportedInterfaceChainId,
  chainIdToBackendChain,
  useIsSupportedChainId,
  useSupportedChainId,
} from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { PollingInterval } from 'graphql/data/util'
import { useMemo } from 'react'
import { ClassicTrade, INTERNAL_ROUTER_PREFERENCE_PRICE, TradeState } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { Chain, useTokenSpotPriceQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

import useIsWindowVisible from './useIsWindowVisible'
import useStablecoinPrice from './useStablecoinPrice'

// ETH amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
function getEthAmountOut(chainId: SupportedInterfaceChainId): CurrencyAmount<Currency> {
  return CurrencyAmount.fromRawAmount(nativeOnChain(chainId), chainId === ChainId.MAINNET ? 50e18 : 10e18)
}

function useETHPrice(currency?: Currency): {
  data?: Price<Currency, Currency>
  isLoading: boolean
} {
  const chainId = currency?.chainId
  const isSupportedChain = useIsSupportedChainId(chainId)
  const isSupported = isSupportedChain && currency

  const amountOut = isSupported ? getEthAmountOut(chainId) : undefined
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

    // if initial quoting fails, we may end up with a DutchOrderTrade
    if (trade && trade instanceof ClassicTrade) {
      const { numerator, denominator } = trade.routes[0].midPrice
      const price = new Price(currency, nativeOnChain(chainId), denominator, numerator)
      return { data: price, isLoading: false }
    }

    return { data: undefined, isLoading: false }
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
  const chainId = useSupportedChainId(currency?.chainId)
  const chain = chainIdToBackendChain({ chainId })

  // skip all pricing requests if the window is not focused
  const isWindowVisible = useIsWindowVisible()

  // Use ETH-based pricing if available.
  const { data: tokenEthPrice, isLoading: isTokenEthPriceLoading } = useETHPrice(currency)
  const isTokenEthPriced = Boolean(tokenEthPrice || isTokenEthPriceLoading)
  const { data, networkStatus } = useTokenSpotPriceQuery({
    variables: { chain: chain ?? Chain.Ethereum, address: getNativeTokenDBAddress(chain ?? Chain.Ethereum) },
    skip: !isTokenEthPriced || !isWindowVisible,
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
