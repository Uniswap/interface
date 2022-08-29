import { Chef } from 'constants/farm/chef.enum'
import { BigNumber } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { useMemo } from 'react'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useChefContract } from './useChefContract'
// import useMasterChef from "./useMasterChef"

export interface MasterChefRawPoolInfo {
  accSushiPerShare: BigNumber
  allocPoint: BigNumber
  lpToken: string
  // either lastRewardTime or lastRewardBlock
  lastRewardTime?: BigNumber
  lastRewardBlock?: BigNumber
}

/**
 * get raw `poolInfos` data from the given `chef`
 * @param chef the chef verison
 * @returns the unified raw `poolInfos` data
 * (since MC v2 have moved `lpToken` to another array object
 * and minichef is based on timestamp instead of block number)
 */
export function useMasterChefPoolInfo(chef: Chef): MasterChefRawPoolInfo[] {
  const { account } = useActiveWeb3React()
  const contract = useChefContract(chef)
  const numberOfPools = useSingleCallResult(contract ? contract : null, 'poolLength', undefined, NEVER_RELOAD)
    ?.result?.[0]

  const args = useMemo(() => {
    if (!account || !numberOfPools) {
      return
    }
    return [...Array(numberOfPools.toNumber()).keys()].map(pid => [String(pid)])
  }, [numberOfPools, account])

  const result = useSingleContractMultipleData(args ? contract : null, 'poolInfo', args)
  const mcv2LpToken = useSingleContractMultipleData(chef !== Chef.MASTERCHEF ? contract : null, 'lpToken', args)

  return result
    .map((callState, idx) =>
      callState.result
        ? ({
            accSushiPerShare: callState.result.accSushiPerShare,
            lastRewardTime: callState.result.lastRewardTime,
            allocPoint: callState.result.allocPoint,
            lpToken: callState.result.lpToken || mcv2LpToken[idx].result?.at(0),
            lastRewardBlock: callState.result.lastRewardBlock
          } as MasterChefRawPoolInfo)
        : undefined
    )
    .filter<MasterChefRawPoolInfo>((c): c is MasterChefRawPoolInfo => Boolean(c))
}
