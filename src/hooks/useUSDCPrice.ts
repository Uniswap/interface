import { ChainId, Currency, CurrencyAmount, currencyEquals, Price, Token, WETH9 } from '@uniswap/sdk-core'
import { JSBI } from '@uniswap/v2-sdk'
import { useMemo } from 'react'
import { USDC } from '../constants'
import { PairState, useV2Pairs } from './useV2Pairs'
import { useActiveWeb3React } from '../hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price | undefined {
  const { chainId } = useActiveWeb3React()
  const wrapped = wrappedCurrency(currency, chainId)
  const weth = WETH9[chainId as ChainId]

  const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
    () => [
      [chainId && wrapped && currencyEquals(weth, wrapped) ? undefined : currency, chainId ? weth : undefined],
      [wrapped?.equals(USDC) ? undefined : wrapped, chainId === ChainId.MAINNET ? USDC : undefined],
      [chainId ? weth : undefined, chainId === ChainId.MAINNET ? USDC : undefined],
    ],
    [chainId, currency, weth, wrapped]
  )
  const [[ethPairState, ethPair], [usdcPairState, usdcPair], [usdcEthPairState, usdcEthPair]] = useV2Pairs(tokenPairs)

  return useMemo(() => {
    if (!currency || !wrapped || !chainId) {
      return undefined
    }
    // return some fake price data for non-mainnet
    if (chainId !== ChainId.MAINNET) {
      const fakeUSDC = new Token(chainId, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'fUSDC', 'Fake USDC')
      return new Price(
        currency,
        fakeUSDC,
        10 ** Math.max(0, currency.decimals - 6),
        15 * 10 ** Math.max(6 - currency.decimals, 0)
      )
    }

    // handle weth/eth
    if (wrapped.equals(weth)) {
      if (usdcPair) {
        const price = usdcPair.priceOf(weth)
        return new Price(currency, USDC, price.denominator, price.numerator)
      } else {
        return undefined
      }
    }
    // handle usdc
    if (wrapped.equals(USDC)) {
      return new Price(USDC, USDC, '1', '1')
    }

    const ethPairETHAmount = ethPair?.reserveOf(weth)
    const ethPairETHUSDCValue: JSBI =
      ethPairETHAmount && usdcEthPair ? usdcEthPair.priceOf(weth).quote(ethPairETHAmount).raw : JSBI.BigInt(0)

    // all other tokens
    // first try the usdc pair
    if (usdcPairState === PairState.EXISTS && usdcPair && usdcPair.reserveOf(USDC).greaterThan(ethPairETHUSDCValue)) {
      const price = usdcPair.priceOf(wrapped)
      return new Price(currency, USDC, price.denominator, price.numerator)
    }
    if (ethPairState === PairState.EXISTS && ethPair && usdcEthPairState === PairState.EXISTS && usdcEthPair) {
      if (usdcEthPair.reserveOf(USDC).greaterThan('0') && ethPair.reserveOf(weth).greaterThan('0')) {
        const ethUsdcPrice = usdcEthPair.priceOf(USDC)
        const currencyEthPrice = ethPair.priceOf(weth)
        const usdcPrice = ethUsdcPrice.multiply(currencyEthPrice).invert()
        return new Price(currency, USDC, usdcPrice.denominator, usdcPrice.numerator)
      }
    }
    return undefined
  }, [chainId, currency, ethPair, ethPairState, usdcEthPair, usdcEthPairState, usdcPair, usdcPairState, weth, wrapped])
}

export function useUSDCValue(currencyAmount: CurrencyAmount | undefined | null) {
  const price = useUSDCPrice(currencyAmount?.currency)

  return useMemo(() => {
    if (!price || !currencyAmount) return null
    return price.quote(currencyAmount)
  }, [currencyAmount, price])
}
