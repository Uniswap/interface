import { Currency, currencyEquals, JSBI, Price, WONE } from '@swoop-exchange/sdk'
import { useMemo } from 'react'
import { USDC } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { hmy } from '../connectors'
//import { useActiveWeb3React } from '../hooks'
import { wrappedCurrency } from './wrappedCurrency'

const { ChainID } = require("@harmony-js/utils");

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price | undefined {
  const { chainId } = hmy.chainId;
  const wrapped = wrappedCurrency(currency, chainId)
  const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
    () => [
      [
        // @ts-ignore
        chainId && wrapped && currencyEquals(WONE[chainId], wrapped) ? undefined : currency,
        // @ts-ignore
        chainId ? WONE[chainId] : undefined
      ],
      // @ts-ignore
      [wrapped?.equals(USDC) ? undefined : wrapped, chainId === ChainID.HmyMainnet ? USDC : undefined],
      // @ts-ignore
      [chainId ? WONE[chainId] : undefined, chainId === ChainID.HmyMainnet ? USDC : undefined]
    ],
    [chainId, currency, wrapped]
  )
  const [[ethPairState, ethPair], [usdcPairState, usdcPair], [usdcEthPairState, usdcEthPair]] = usePairs(tokenPairs)

  return useMemo(() => {
    if (!currency || !wrapped || !chainId) {
      return undefined
    }
    // handle weth/eth
    // @ts-ignore
    if (wrapped.equals(WONE[chainId])) {
      if (usdcPair) {
        // @ts-ignore
        const price = usdcPair.priceOf(WONE[chainId])
        return new Price(currency, USDC, price.denominator, price.numerator)
      } else {
        return undefined
      }
    }
    // handle usdc
    if (wrapped.equals(USDC)) {
      return new Price(USDC, USDC, '1', '1')
    }

    // @ts-ignore
    const ethPairETHAmount = ethPair?.reserveOf(WONE[chainId])
    const ethPairETHUSDCValue: JSBI =
    // @ts-ignore
      ethPairETHAmount && usdcEthPair ? usdcEthPair.priceOf(WONE[chainId]).quote(ethPairETHAmount).raw : JSBI.BigInt(0)

    // all other tokens
    // first try the usdc pair
    if (usdcPairState === PairState.EXISTS && usdcPair && usdcPair.reserveOf(USDC).greaterThan(ethPairETHUSDCValue)) {
      const price = usdcPair.priceOf(wrapped)
      return new Price(currency, USDC, price.denominator, price.numerator)
    }
    if (ethPairState === PairState.EXISTS && ethPair && usdcEthPairState === PairState.EXISTS && usdcEthPair) {
      // @ts-ignore
      if (usdcEthPair.reserveOf(USDC).greaterThan('0') && ethPair.reserveOf(WONE[chainId]).greaterThan('0')) {
        const ethUsdcPrice = usdcEthPair.priceOf(USDC)
        // @ts-ignore
        const currencyEthPrice = ethPair.priceOf(WONE[chainId])
        const usdcPrice = ethUsdcPrice.multiply(currencyEthPrice).invert()
        return new Price(currency, USDC, usdcPrice.denominator, usdcPrice.numerator)
      }
    }
    return undefined
  }, [chainId, currency, ethPair, ethPairState, usdcEthPair, usdcEthPairState, usdcPair, usdcPairState, wrapped])
}
