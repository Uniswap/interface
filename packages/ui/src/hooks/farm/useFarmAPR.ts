import { CurrencyAmount, JSBI, Pair, Price, Token, TokenAmount } from '@teleswap/sdk'
import { BigNumber } from 'ethers'
import { NEVER_RELOAD, useSingleCallResult } from 'state/multicall/hooks'

import { useUSDEvaluation } from './evaluation/useUSDEvaluation'
import { useChefContractForCurrentChain } from './useChefContract'
import { MasterChefRawPoolInfo } from './useMasterChefPoolInfo'

export function calculateFarmPoolAPR(
  rewardRatePerSecond: JSBI,
  totalStakedAmountInUSD: CurrencyAmount,
  usdPriceOfRewardToken: Price
) {
  const year = JSBI.BigInt(365 * 24 * 3600)
  const yearlyReward = JSBI.multiply(rewardRatePerSecond, year)
  const yearlyRewardInCA = CurrencyAmount.fromRawAmount(usdPriceOfRewardToken.baseCurrency, yearlyReward)
  const estimatedYearlyEarningForThisPoolInUSD = usdPriceOfRewardToken.quote(yearlyRewardInCA)
  console.info('calculateFarmPoolAPR', {
    rewardRatePerSecond: rewardRatePerSecond.toString(),
    estimatedYearlyEarningForThisPoolInUSD: estimatedYearlyEarningForThisPoolInUSD.raw.toString(),
    totalStakedAmountInUSD: totalStakedAmountInUSD.raw.toString()
  })
  return (Number(estimatedYearlyEarningForThisPoolInUSD.raw) / Number(totalStakedAmountInUSD.raw)) * 100
}

export function useMasterChefMiscData() {
  const contract = useChefContractForCurrentChain()
  const totalAllocPoint = useSingleCallResult(contract ? contract : null, 'totalAllocPoint', undefined, NEVER_RELOAD)
    ?.result?.[0] as BigNumber | undefined
  const sushiPerSecond = useSingleCallResult(contract ? contract : null, 'sushiPerSecond', undefined, NEVER_RELOAD)
    ?.result?.[0] as BigNumber | undefined
  return { totalAllocPoint, sushiPerSecond }
}

// export function useChefPoolAPRs(
//   poolInfos: MasterChefRawPoolInfo[],
//   totalTokensLocked: (TokenAmount | undefined)[],
//   usdPriceOfRewardToken: Price
// ) {
//   const { chainId } = useActiveWeb3React()
//   const rewardToken = UNI[chainId || 420]

//   const { totalAllocPoint, sushiPerSecond } = useMasterChefMiscData()
//   const allocPoints = poolInfos.map(({ allocPoint }) => allocPoint)
//   const rewardRatePerPoolPerSecond = allocPoints.map((allocPoint) => {
//     if (!totalAllocPoint || !sushiPerSecond) return undefined
//     return JSBI.BigInt(sushiPerSecond.mul(allocPoint).div(totalAllocPoint).toString())
//   })
// //   const totalStakedAmountInUSD = usePairUSDValue('', totalStakedTokenAmount)
//   const aprs = rewardRatePerPoolPerSecond.map((rewardRatePerSecond, idx) => {
//     const totalTokenLocked = totalTokensLocked[idx]
//     if (!rewardRatePerSecond || !totalTokenLocked || !usdPriceOfRewardToken) return undefined
//     return calculateFarmPoolAPR(rewardRatePerSecond, rewardToken, totalStakedAmountInUSD, usdPriceOfRewardToken)
//   })
//   return aprs
// }

export function useChefPoolAPR(
  poolInfo: MasterChefRawPoolInfo,
  stakingToken: Token | Pair | null,
  totalTokenLocked: TokenAmount | undefined,
  usdPriceOfRewardToken?: Price
) {
  const { totalAllocPoint, sushiPerSecond } = useMasterChefMiscData()
  const totalStakedAmountInUSD = useUSDEvaluation(stakingToken, totalTokenLocked)
  if (!sushiPerSecond || !totalAllocPoint || !usdPriceOfRewardToken) return undefined
  const { allocPoint } = poolInfo

  const rewardRatePerSecond = JSBI.BigInt(sushiPerSecond.mul(allocPoint).div(totalAllocPoint).toString())
  if (!totalStakedAmountInUSD) return undefined
  return calculateFarmPoolAPR(rewardRatePerSecond, totalStakedAmountInUSD, usdPriceOfRewardToken)
}
