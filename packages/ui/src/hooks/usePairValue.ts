import { CurrencyAmount, JSBI, Pair, Price, TokenAmount } from '@teleswap/sdk'
import { useTotalSupply } from 'data/TotalSupply'
import useUSDCPrice from 'utils/useUSDCPrice'

export function calculateUSDValueForLiquidity(
  pair: Pair | null,
  liquidity?: TokenAmount,
  totalSupplyOfLPToken?: TokenAmount,
  usdPriceOfToken0?: Price,
  usdPriceOfToken1?: Price
): CurrencyAmount | undefined {
  if (!pair) return undefined
  const whichTokenThatHaveUSDPrice = usdPriceOfToken0 ? pair?.token0 : usdPriceOfToken1 ? pair?.token1 : undefined
  const whichPrice = !whichTokenThatHaveUSDPrice
    ? undefined
    : whichTokenThatHaveUSDPrice.equals(pair.token0)
    ? usdPriceOfToken0
    : usdPriceOfToken1

  if (whichTokenThatHaveUSDPrice) {
    let valueOfTotalStakedAmountInToken: TokenAmount | undefined
    if (totalSupplyOfLPToken && pair) {
      // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens
      valueOfTotalStakedAmountInToken = new TokenAmount(
        whichTokenThatHaveUSDPrice,
        // ((liquidityQty * stakingPair.reserveOf(WETH)) * 2) / totalSupplyOfLPToken
        /**
         * ((liquidityQty * stakingPair.reserveOf(WETH)) * 2) / totalSupplyOfLPToken
         *  __WETH amount for the part of liquidityQty__
         *  mul 2 is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
         */
        JSBI.divide(
          JSBI.multiply(
            JSBI.multiply(liquidity?.raw || JSBI.BigInt(0), pair.reserveOf(whichTokenThatHaveUSDPrice).raw),
            JSBI.BigInt(2)
          ),
          totalSupplyOfLPToken.raw
        )
      )
    }

    // get the USD value of staked whichTokenThatHaveUSDPrice
    const valueOfTotalStakedAmountInUSDC =
      valueOfTotalStakedAmountInToken && whichPrice?.quote(valueOfTotalStakedAmountInToken)
    return valueOfTotalStakedAmountInUSDC
  }

  return undefined
}

/**
 * calculate the total USD value of a pair
 * for a single token, please use `useUSDCPrice`
 * @param pair the pair object
 * @param liquidity the liquidity to need to estimate USD value with
 * @returns the USD(C) value that represent given `liquidity` of the given `pair`
 */
export function usePairUSDValue(pair: Pair | null, liquidity?: TokenAmount): CurrencyAmount | undefined {
  const totalSupplyOfLPToken = useTotalSupply(pair?.liquidityToken)
  const usdPriceOfToken0 = useUSDCPrice(pair?.token0)
  const usdPriceOfToken1 = useUSDCPrice(pair?.token1)
  return calculateUSDValueForLiquidity(pair, liquidity, totalSupplyOfLPToken, usdPriceOfToken0, usdPriceOfToken1)
}

// export function usePairsUSDValue(
//   pairs: { pair: Pair | null; liquidity?: TokenAmount }[]
// ): (CurrencyAmount | undefined)[] {
//   const totalSupplies = useTotalSupplies(pairs.map(({ pair }) => (pair ? pair.liquidityToken : undefined)))
//   return pairs.map(({ pair, liquidity }, idx) => {
//     return pair ? calculateUSDValueForLiquidity(pair, liquidity, totalSupplies[idx], usdPrices0, usdPrice1) : undefined
//   })
// }

export function usePairSidesValueEstimate(
  pair: Pair | null,
  liquidity?: TokenAmount
): { liquidityValueOfToken0?: TokenAmount; liquidityValueOfToken1?: TokenAmount } {
  const totalSupplyOfLPToken = useTotalSupply(pair?.liquidityToken)
  if (totalSupplyOfLPToken && liquidity) {
    try {
      const liquidityValueOfToken0 = pair?.getLiquidityValue(pair.token0, totalSupplyOfLPToken, liquidity)
      const liquidityValueOfToken1 = pair?.getLiquidityValue(pair.token1, totalSupplyOfLPToken, liquidity)
      return { liquidityValueOfToken0, liquidityValueOfToken1 }
    } catch (error) {
      console.error('usePairSidesValueEstimate failed for pair', pair)
      console.error(error)
    }
  }
  return {}
}
