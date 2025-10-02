import { PollingInterval } from 'appGraphql/data/util'
import { NetworkStatus } from '@apollo/client'
import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { useMemo, useRef } from 'react'
import { ClassicTrade, INTERNAL_ROUTER_PREFERENCE_PRICE, TradeState } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsSupportedChainId, useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

// ETH amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
function getEthAmountOut(chainId: UniverseChainId): CurrencyAmount<Currency> {
  return CurrencyAmount.fromRawAmount(nativeOnChain(chainId), chainId === UniverseChainId.Mainnet ? 50e18 : 10e18)
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
    INTERNAL_ROUTER_PREFERENCE_PRICE,
  )

  return useMemo(() => {
    if (!isSupported) {
      return { data: undefined, isLoading: false }
    }

    if (currency.wrapped.equals(nativeOnChain(chainId).wrapped)) {
      return {
        data: new Price(currency, currency, '1', '1'),
        isLoading: false,
      }
    }

    if (!trade || state === TradeState.LOADING) {
      return { data: undefined, isLoading: state === TradeState.LOADING }
    }

    // if initial quoting fails, we may end up with a DutchOrderTrade
    if (trade instanceof ClassicTrade) {
      const { numerator, denominator } = trade.routes[0].midPrice
      const price = new Price(currency, nativeOnChain(chainId), denominator, numerator)
      return { data: price, isLoading: false }
    }

    return { data: undefined, isLoading: false }
  }, [chainId, currency, isSupported, state, trade])
}

const DEFAULT_SPOT_PRICE_AMOUNT = 10_000
function getSpotPriceAmount(chainId: UniverseChainId): CurrencyAmount<Token> {
  const chainInfo = getChainInfo(chainId)
  if (chainInfo.spotPriceStablecoinAmountOverride) {
    return chainInfo.spotPriceStablecoinAmountOverride
  }
  const amount = DEFAULT_SPOT_PRICE_AMOUNT * Math.pow(10, getPrimaryStablecoin(chainId).decimals)
  return CurrencyAmount.fromRawAmount(getPrimaryStablecoin(chainId), amount)
}

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
function useStablecoinPrice(currency?: Currency): {
  price?: Price<Currency, Token>
  state: TradeState
} {
  const chainId = useSupportedChainId(currency?.chainId)
  const amountOut = useMemo(() => (chainId ? getSpotPriceAmount(chainId) : undefined), [chainId])

  const stablecoin = amountOut?.currency
  const { trade, state } = useRoutingAPITrade(
    false /* skip */,
    TradeType.EXACT_OUTPUT,
    amountOut,
    currency,
    INTERNAL_ROUTER_PREFERENCE_PRICE,
  )
  const price = useMemo(() => {
    if (!currency || !stablecoin) {
      return undefined
    }
    // handle usdc
    if (currency.wrapped.equals(stablecoin)) {
      return new Price(stablecoin, stablecoin, '1', '1')
    }
    // if initial quoting fails, we may end up with a DutchOrderTrade
    if (trade && trade instanceof ClassicTrade) {
      const { numerator, denominator } = trade.routes[0].midPrice
      return new Price(currency, stablecoin, denominator, numerator)
    }
    return undefined
  }, [currency, stablecoin, trade])
  const lastPrice = useRef(price)
  if (
    !price ||
    !lastPrice.current ||
    !price.equalTo(lastPrice.current) ||
    !price.baseCurrency.equals(lastPrice.current.baseCurrency)
  ) {
    lastPrice.current = price
  }
  return { price: lastPrice.current, state }
}

/** @deprecated this should only be used in the legacy swap flow  */
export function useUSDPrice(
  currencyAmount?: CurrencyAmount<Currency>,
  prefetchCurrency?: Currency,
): {
  data?: number
  isLoading: boolean
} {
  const currency = currencyAmount?.currency ?? prefetchCurrency
  const chainId = useSupportedChainId(currency?.chainId)
  const { defaultChainId } = useEnabledChains()
  const chain = toGraphQLChain(chainId ?? defaultChainId)

  // skip all pricing requests if the window is not focused
  const isWindowVisible = useIsWindowVisible()

  // Use ETH-based pricing if available.
  const { data: tokenEthPrice, isLoading: isTokenEthPriceLoading } = useETHPrice(currency)
  const isTokenEthPriced = Boolean(tokenEthPrice || isTokenEthPriceLoading)
  const { data, networkStatus } = GraphQLApi.useTokenSpotPriceQuery({
    variables: { chain, address: getNativeTokenDBAddress(chain) },
    skip: !isTokenEthPriced || !isWindowVisible,
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-first',
  })

  // Use USDC-based pricing for chains not yet supported by backend (for ETH-based pricing).
  const { price: stablecoinPrice } = useStablecoinPrice(isTokenEthPriced ? undefined : currency)

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
