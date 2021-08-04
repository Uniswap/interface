import { BigNumber } from 'ethers'
import { defaultAbiCoder, keccak256, Result } from 'ethers/lib/utils'
import { Incentive } from './useAllIncentives'

export interface IncentiveKey {
  rewardToken: string
  pool: string
  startTime: BigNumber | number
  endTime: BigNumber | number
  refundee: string
}

/**
 * Encodes the incentive to the ID
 * @param incentiveKey the key of the incentive
 */
export function incentiveKeyToIncentiveId(incentiveKey: IncentiveKey | Result): string {
  return keccak256(
    defaultAbiCoder.encode(
      ['address', 'address', 'uint256', 'uint256', 'address'],
      [incentiveKey.rewardToken, incentiveKey.pool, incentiveKey.startTime, incentiveKey.endTime, incentiveKey.refundee]
    )
  )
}

// used for gettign unique ids of incentive program
export function incentiveToIncentiveId(incentive: Incentive): string {
  return incentiveKeyToIncentiveId({
    rewardToken: incentive.initialRewardAmount.currency.address,
    pool: incentive.poolAddress,
    startTime: incentive.startTime,
    endTime: incentive.endTime,
    refundee: incentive.refundee,
  })
}
