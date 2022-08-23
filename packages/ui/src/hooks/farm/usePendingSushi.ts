import { CurrencyAmount, JSBI } from "@teleswap/sdk"
import { UNI } from "constants/"
import { Chef } from "constants/farm/chef.enum"
import { useActiveWeb3React } from "hooks"
import { useMasterChefContract } from "hooks/useContract"
import { useMemo } from "react"
import { useSingleCallResult } from "state/multicall/hooks"
// import useMasterChef from "./useMasterChef"

export function usePendingSushi(farm: { chef: Chef, id: any }) {
    const { account, chainId } = useActiveWeb3React()
    // const contract = useMasterChef(farm.chef)
    const contract = useMasterChefContract()
  
    const args = useMemo(() => {
      if (!account) {
        return
      }
      return [String(farm.id), String(account)]
    }, [farm, account])
  
    const result = useSingleCallResult(args ? contract : null, 'pendingSushi', args)?.result
  
    const value = result?.[0]
  
    const amount = value ? JSBI.BigInt(value.toString()) : undefined
  
    return amount ? CurrencyAmount.fromRawAmount(UNI[chainId || 420], amount) : undefined
}