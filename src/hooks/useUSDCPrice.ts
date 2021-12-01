import { Currency, CurrencyAmount, Price, Token, TradeType } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { V3TradeState } from 'state/routing/types'
import { tryParseAmount } from 'state/swap/hooks'

import { SupportedChainId } from '../constants/chains'
import { DAI_OPTIMISM, USDC, USDC_ARBITRUM } from '../constants/tokens'
import { useCurrency } from './Tokens'
import { useBestV2Trade } from './useBestV2Trade'
import { useBestV3Trade } from './useBestV3Trade'
import { useClientSideV3Trade } from './useClientSideV3Trade'
import { useActiveWeb3React } from './web3'

// Stablecoin amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
export const STABLECOIN_AMOUNT_OUT: { [chainId: number]: CurrencyAmount<Token> } = {
  [SupportedChainId.MAINNET]: CurrencyAmount.fromRawAmount(USDC, 100_000e6),
  [SupportedChainId.ARBITRUM_ONE]: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10_000e6),
  [SupportedChainId.OPTIMISM]: CurrencyAmount.fromRawAmount(DAI_OPTIMISM, 10_000e18),
}

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price<Currency, Token> | undefined {
  const { chainId } = useActiveWeb3React()

  const amountOut = chainId ? STABLECOIN_AMOUNT_OUT[chainId] : undefined
  const stablecoin = amountOut?.currency

  // TODO(#2808): remove dependency on useBestV2Trade
  const v2USDCTrade = useBestV2Trade(TradeType.EXACT_OUTPUT, amountOut, currency, {
    maxHops: 2,
  })
  const v3USDCTrade = useClientSideV3Trade(TradeType.EXACT_OUTPUT, amountOut, currency)

  return useMemo(() => {
    if (!currency || !stablecoin) {
      return undefined
    }

    // handle usdc
    if (currency?.wrapped.equals(stablecoin)) {
      return new Price(stablecoin, stablecoin, '1', '1')
    }

    // use v2 price if available, v3 as fallback
    if (v2USDCTrade) {
      const { numerator, denominator } = v2USDCTrade.route.midPrice
      return new Price(currency, stablecoin, denominator, numerator)
    } else if (v3USDCTrade.trade) {
      const { numerator, denominator } = v3USDCTrade.trade.routes[0].midPrice
      return new Price(currency, stablecoin, denominator, numerator)
    }

    return undefined
  }, [currency, stablecoin, v2USDCTrade, v3USDCTrade.trade])
}

export function useUSDCValue(currencyAmount: CurrencyAmount<Currency> | undefined | null) {
  const price = useUSDCPrice(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) return null
    try {
      return price.quote(currencyAmount)
    } catch (error) {
      return null
    }
  }, [currencyAmount, price])
}

/**
 *
 * @param fiatValue string representation of a USD amount
 * @returns CurrencyAmount where currency is stablecoin on active chain
 */
export function useStablecoinAmountFromFiatValue(fiatValue: string | null | undefined) {
  const { chainId } = useActiveWeb3React()
  const stablecoin = chainId ? STABLECOIN_AMOUNT_OUT[chainId]?.currency : undefined

  if (fiatValue === null || fiatValue === undefined || !chainId || !stablecoin) {
    return undefined
  }

  // trim for decimal precision when parsing
  const parsedForDecimals = parseFloat(fiatValue).toFixed(stablecoin.decimals).toString()

  try {
    // parse USD string into CurrencyAmount based on stablecoin decimals
    return tryParseAmount(parsedForDecimals, stablecoin)
  } catch (error) {
    return undefined
  }
}

/**
 * Get gas cost estimate for a dummy ETH / Stable v3 trade
 * @returns Estimate in form of stablecoin amount or null
 */
export function useDefaultGasCostEstimate(): {
  cost: CurrencyAmount<Token> | null
  loading: boolean
  syncing: boolean
} {
  const { chainId } = useActiveWeb3React()
  const stablecoin = chainId ? STABLECOIN_AMOUNT_OUT[chainId]?.currency : undefined
  const ether = useCurrency('ETH')
  const dummyEthAmount = ether ? CurrencyAmount.fromRawAmount(ether, JSBI.BigInt(1)) : undefined
  const trade = useBestV3Trade(TradeType.EXACT_INPUT, dummyEthAmount ?? undefined, stablecoin)

  const [routeIsLoading, routeIsSyncing] = useMemo(
    () => [!trade.trade?.swaps, V3TradeState.LOADING === trade.state, V3TradeState.SYNCING === trade.state],
    [trade]
  )

  return {
    cost: trade?.gasUseEstimateUSD,
    loading: routeIsLoading,
    syncing: routeIsSyncing,
  }
}
