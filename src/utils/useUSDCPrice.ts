import { ChainId, Currency, currencyEquals, JSBI, Price, WETH } from '@uniswap/sdk'
import { useMemo } from 'react'
import { USDC } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { useActiveWeb3React } from '../hooks'
import { wrappedCurrency } from './wrappedCurrency'

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price | undefined {
  const { chainId } = useActiveWeb3React()
  const wrapped = wrappedCurrency(currency, chainId)
  const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
    () => [
      [
        chainId && wrapped && currencyEquals(WETH[chainId], wrapped) ? undefined : currency,
        chainId ? WETH[chainId] : undefined
      ],
      [wrapped?.equals(USDC) ? undefined : wrapped, chainId === ChainId.MAINNET ? USDC : undefined],
      [chainId ? WETH[chainId] : undefined, chainId === ChainId.MAINNET ? USDC : undefined]
    ],
    [chainId, currency, wrapped]
  )
  const [[ethPairState, ethPair], [usdcPairState, usdcPair], [usdcEthPairState, usdcEthPair]] = usePairs(tokenPairs)

  return useMemo(() => {
    if (!currency || !wrapped || !chainId) {
      return
    }
    // handle weth/eth
    if (wrapped.equals(WETH[chainId])) {
      if (usdcPair) {
        const price = usdcPair.priceOf(WETH[chainId])
        return new Price(currency, USDC, price.denominator, price.numerator)
      } else {
        return undefined
      }
    }
    // handle usdc
    if (wrapped.equals(USDC)) {
      return new Price(USDC, USDC, '1', '1')
    }

    const ethPairETHAmount = ethPair?.reserveOf(WETH[chainId])
    const ethPairETHUSDCValue: JSBI =
      ethPairETHAmount && usdcEthPair ? usdcEthPair.priceOf(WETH[chainId]).quote(ethPairETHAmount).raw : JSBI.BigInt(0)

    // all other tokens
    // first try the usdc pair
    if (usdcPairState === PairState.EXISTS && usdcPair && usdcPair.reserveOf(USDC).greaterThan(ethPairETHUSDCValue)) {
      const price = usdcPair.priceOf(wrapped)
      return new Price(currency, USDC, price.denominator, price.numerator)
    }
    if (ethPairState === PairState.EXISTS && ethPair && usdcEthPairState === PairState.EXISTS && usdcEthPair) {
      if (usdcEthPair.reserveOf(USDC).greaterThan('0') && ethPair.reserveOf(WETH[chainId]).greaterThan('0')) {
        const ethUsdcPrice = usdcEthPair.priceOf(USDC)
        const currencyEthPrice = ethPair.priceOf(WETH[chainId])
        const usdcPrice = ethUsdcPrice.multiply(currencyEthPrice).invert()
        return new Price(currency, USDC, usdcPrice.denominator, usdcPrice.numerator)
      }
    }
    return
  }, [chainId, currency, ethPair, ethPairState, usdcEthPair, usdcEthPairState, usdcPair, usdcPairState, wrapped])
}
