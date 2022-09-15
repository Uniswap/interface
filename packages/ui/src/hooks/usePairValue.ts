import { Pair, TokenAmount } from '@teleswap/sdk'
import { USDC } from 'constants/index'
import { useTotalSupply } from 'data/TotalSupply'
// import useUSDCPrice from 'utils/useUSDCPrice'

export function usePairUSDValue(pair: Pair | null, liquidity?: TokenAmount) {
  console.debug('usePairUSDValue:1')
  const totalSupplyOfLPToken = useTotalSupply(pair?.liquidityToken)
  console.debug('usePairUSDValue:2', pair)
  // @todo: should be compatible with a single token
  if (!pair) return '--.--'
  const isUSDCInThisPair = pair.involvesToken(USDC)
  const isPair0USDC = pair.token0.equals(USDC)
  // const usdPriceOfToken0 = useUSDCPrice(pair.token0)
  // const usdPriceOfToken1 = useUSDCPrice(pair.token1)
  console.debug('usePairUSDValue:3')

  // let price: Price | undefined
  console.debug('isUSDCInThisPair', isUSDCInThisPair)
  console.debug('totalSupplyOfLPToken', totalSupplyOfLPToken)
  console.debug('liquidity', liquidity)
  if (isUSDCInThisPair && totalSupplyOfLPToken && liquidity) {
    const liquidityValue = pair.getLiquidityValue(
      isPair0USDC ? pair.token0 : pair.token1,
      totalSupplyOfLPToken,
      liquidity
    )
    console.debug('usePairUSDValue:10')
    // lp value = one side value * 2
    return `$ ${liquidityValue.add(liquidityValue).toSignificant(6)}`
  } else {
    // todo: i do not know what to do now
    // price = usdPriceOfToken0 || usdPriceOfToken1
  }

  return '--.--'
}

export function usePairSidesValueEstimate(
  pair: Pair | null,
  liquidity?: TokenAmount
): { liquidityValueOfToken0?: TokenAmount; liquidityValueOfToken1?: TokenAmount } {
  const totalSupplyOfLPToken = useTotalSupply(pair?.liquidityToken)
  if (totalSupplyOfLPToken && liquidity) {
    const liquidityValueOfToken0 = pair?.getLiquidityValue(pair.token0, totalSupplyOfLPToken, liquidity)
    const liquidityValueOfToken1 = pair?.getLiquidityValue(pair.token1, totalSupplyOfLPToken, liquidity)
    return { liquidityValueOfToken0, liquidityValueOfToken1 }
  }
  return {}
}
