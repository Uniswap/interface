import { BigNumber } from 'ethers'
import { Incentive } from 'hooks/incentives/useAllIncentives'

export default class Stake {
  public readonly incentive: Incentive
  public readonly liquidity: BigNumber
  public readonly secondsPerLiquidityInsideInitialX128: BigNumber

  constructor(incentive: Incentive, liquidity: BigNumber, secondsPerLiquidityInsideInitialX128: BigNumber) {
    this.incentive = incentive
    this.liquidity = liquidity
    this.secondsPerLiquidityInsideInitialX128 = secondsPerLiquidityInsideInitialX128
  }
}
