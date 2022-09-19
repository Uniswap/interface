import { JSBI, Pair, TokenAmount, WETH as WETHBook } from '@teleswap/sdk'
import { USDC } from 'constants/index'
import { useTotalSupply } from 'data/TotalSupply'
import { useActiveWeb3React } from 'hooks'
import useUSDCPrice from 'utils/useUSDCPrice'
// import useUSDCPrice from 'utils/useUSDCPrice'

export function usePairUSDValue(pair: Pair | null, liquidity?: TokenAmount) {
  const totalSupplyOfLPToken = useTotalSupply(pair?.liquidityToken)
  const { chainId } = useActiveWeb3React()
  const WETH = WETHBook[chainId || 420]
  const USDPrice = useUSDCPrice(WETH)
  // @todo: should be compatible with a single token
  if (!pair) return '--.--'
  const isUSDCInThisPair = pair.involvesToken(USDC)
  const isPair0USDC = pair.token0.equals(USDC)
  // const usdPriceOfToken0 = useUSDCPrice(pair.token0)
  // const usdPriceOfToken1 = useUSDCPrice(pair.token1)
  console.debug('usePairUSDValue:state', {
    pair,
    isPair0USDC,
    isUSDCInThisPair,
    totalSupplyOfLPToken
  })

  console.debug(
    'usePairUSDValue',
    {
      isUSDCInThisPair,
      totalSupplyOfLPToken,
      liquidity
    },
    pair
  )
  if (isUSDCInThisPair && totalSupplyOfLPToken && liquidity) {
    try {
      const liquidityValue = pair.getLiquidityValue(
        isPair0USDC ? pair.token0 : pair.token1,
        totalSupplyOfLPToken,
        liquidity
      )
      // lp value = one side value * 2
      return `$ ${liquidityValue.add(liquidityValue).toSignificant(6)}`
    } catch (error) {
      console.error('usePairUSDValue::failed for pair:', pair)
      console.error(error)
    }
  } else if (pair.involvesToken(WETH)) {
    // todo: i do not know what to do now
    // price = usdPriceOfToken0 || usdPriceOfToken1
    let valueOfTotalStakedAmountInWETH: TokenAmount | undefined
    if (totalSupplyOfLPToken && pair) {
      // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens
      valueOfTotalStakedAmountInWETH = new TokenAmount(
        WETH,
        // ((liquidityQty * stakingPair.reserveOf(WETH)) * 2) / totalSupplyOfLPToken
        /**
         * ((liquidityQty * stakingPair.reserveOf(WETH)) * 2) / totalSupplyOfLPToken
         *  __WETH amount for the part of liquidityQty__
         *  mul 2 is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
         */
        JSBI.divide(
          JSBI.multiply(JSBI.multiply(liquidity?.raw || JSBI.BigInt(0), pair.reserveOf(WETH).raw), JSBI.BigInt(2)),
          totalSupplyOfLPToken.raw
        )
      )
    }

    // get the USD value of staked WETH
    const valueOfTotalStakedAmountInUSDC =
      valueOfTotalStakedAmountInWETH && USDPrice?.quote(valueOfTotalStakedAmountInWETH)
    console.debug('valueOfTotalStakedAmountInUSDC', valueOfTotalStakedAmountInUSDC)
    return `$ ${valueOfTotalStakedAmountInUSDC?.toSignificant(6)}`
  }

  return '--.--'
}

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
