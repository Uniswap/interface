import { Chef } from "constants/farm/chef.enum"
import { BigNumber } from "ethers"
import { useActiveWeb3React } from "hooks"
import { useMemo } from "react"
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from "state/multicall/hooks"
import { useChefContract } from "./useChefContract"
// import useMasterChef from "./useMasterChef"

export function useMasterChefPoolInfo(chef: Chef) {
    const { account } = useActiveWeb3React()
    const contract = useChefContract(chef)
    const numberOfPools = useSingleCallResult(contract ? contract : null, 'poolLength', undefined, NEVER_RELOAD)
      ?.result?.[0]

    const args = useMemo(() => {
      if (!account || !numberOfPools) {
        return
      }
      return [...Array(numberOfPools.toNumber()).keys()].map((pid) => [String(pid)])
    }, [numberOfPools, account])

  
    const result = useSingleContractMultipleData(args ? contract : null, 'poolInfo', args)
  
    console.info('useMasterChefPoolInfo::result', result)
  
    return result.map((callResult) => ({
      accSushiPerShare: callResult.result?.accSushiPerShare as BigNumber | undefined,
      allocPoint: callResult.result?.allocPoint as BigNumber | undefined,
      lpToken: callResult.result?.lpToken as string | undefined,
      lastRewardBlock: callResult.result?.lastRewardBlock as BigNumber | undefined,
    }))
}