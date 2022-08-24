import { CurrencyAmount, JSBI } from "@teleswap/sdk"
import { UNI } from "constants/"
import { Chef } from "constants/farm/chef.enum"
import { BigNumber } from "ethers"
import { useActiveWeb3React } from "hooks"
import { useMasterChefContract } from "hooks/useContract"
import { useMemo } from "react"
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from "state/multicall/hooks"
// import useMasterChef from "./useMasterChef"

export function useMasterChefPoolInfo(farm?: { chef: Chef, id: any }) {
    const { account } = useActiveWeb3React()
    // const contract = useMasterChef(farm.chef)
    const contract = useMasterChefContract()
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