import { ChainId, Currency, currencyEquals, JSBI, Price } from '@uniswap/sdk'
import { useMemo } from 'react'
import constants from '../constants'
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
        chainId && wrapped && currencyEquals(constants[chainId].tokens.WETH, wrapped) ? undefined : currency,
        chainId ? constants[chainId].tokens.WETH : undefined
      ],
      [wrapped?.equals(constants[ChainId.MAINNET].tokens.USDC) ? undefined : wrapped, chainId === ChainId.MAINNET ? constants[ChainId.MAINNET].tokens.USDC : undefined],
      [chainId ? constants[chainId].tokens.WETH : undefined, chainId === ChainId.MAINNET ? constants[ChainId.MAINNET].tokens.USDC : undefined]
    ],
    [chainId, currency, wrapped]
  )
  const [[ethPairState, ethPair], [usdcPairState, usdcPair], [usdcEthPairState, usdcEthPair]] = usePairs(tokenPairs)

  return useMemo(() => {
    if (!currency || !wrapped || !chainId) {
      return undefined
    }
    // handle weth/eth
    if (wrapped.equals(constants[chainId].tokens.WETH)) {
      if (usdcPair) {
        const price = usdcPair.priceOf(constants[chainId].tokens.WETH)
        return new Price(currency, constants[ChainId.MAINNET].tokens.USDC, price.denominator, price.numerator)
      } else {
        return undefined
      }
    }
    // handle usdc
    if (wrapped.equals(constants[ChainId.MAINNET].tokens.USDC)) {
      return new Price(constants[ChainId.MAINNET].tokens.USDC, constants[ChainId.MAINNET].tokens.USDC, '1', '1')
    }

    const ethPairETHAmount = ethPair?.reserveOf(constants[chainId].tokens.WETH)
    const ethPairETHUSDCValue: JSBI =
      ethPairETHAmount && usdcEthPair ? usdcEthPair.priceOf(constants[chainId].tokens.WETH).quote(ethPairETHAmount).raw : JSBI.BigInt(0)

    // all other tokens
    // first try the usdc pair
    if (usdcPairState === PairState.EXISTS && usdcPair && usdcPair.reserveOf(constants[ChainId.MAINNET].tokens.USDC).greaterThan(ethPairETHUSDCValue)) {
      const price = usdcPair.priceOf(wrapped)
      return new Price(currency, constants[ChainId.MAINNET].tokens.USDC, price.denominator, price.numerator)
    }
    if (ethPairState === PairState.EXISTS && ethPair && usdcEthPairState === PairState.EXISTS && usdcEthPair) {
      if (usdcEthPair.reserveOf(constants[ChainId.MAINNET].tokens.USDC).greaterThan('0') && ethPair.reserveOf(constants[chainId].tokens.WETH).greaterThan('0')) {
        const ethUsdcPrice = usdcEthPair.priceOf(constants[ChainId.MAINNET].tokens.USDC)
        const currencyEthPrice = ethPair.priceOf(constants[chainId].tokens.WETH)
        const usdcPrice = ethUsdcPrice.multiply(currencyEthPrice).invert()
        return new Price(currency, constants[ChainId.MAINNET].tokens.USDC, usdcPrice.denominator, usdcPrice.numerator)
      }
    }
    return undefined
  }, [chainId, currency, ethPair, ethPairState, usdcEthPair, usdcEthPairState, usdcPair, usdcPairState, wrapped])
}
