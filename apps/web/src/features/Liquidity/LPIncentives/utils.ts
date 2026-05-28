import { Percent } from '@uniswap/sdk-core'
import { BIPS_BASE } from 'uniswap/src/constants/misc'

export const calculateTotalApr = (poolApr: Percent, rewardsApr: number) => {
  const rewardsAprPercent = new Percent(Math.round(rewardsApr * 100), BIPS_BASE)
  return poolApr.add(rewardsAprPercent)
}
