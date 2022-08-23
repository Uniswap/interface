import { Chef } from "constants/farm/chef.enum"
import { Contract } from "ethers"
import { useActiveWeb3React } from "hooks"
import { useMemo, useCallback } from "react"
import { useSingleCallResult, NEVER_RELOAD, useSingleContractMultipleData } from "state/multicall/hooks"
import { zip } from 'lodash'
import { MASTERCHEF_ADDRESSBOOK } from "constants/index"
import { Zero } from '@ethersproject/constants'

export function useChefPositions(contract?: Contract | null, rewarder?: Contract | null, chainId?: number) {
    const { account } = useActiveWeb3React()
  
    const numberOfPools = useSingleCallResult(contract ? contract : null, 'poolLength', undefined, NEVER_RELOAD)
      ?.result?.[0]

    console.info('numberOfPools', numberOfPools)
  
    const args = useMemo(() => {
      if (!account || !numberOfPools) {
        return
      }
      return [...Array(numberOfPools.toNumber()).keys()].map((pid) => [String(pid), String(account)])
    }, [numberOfPools, account])
  
    const pendingSushi = useSingleContractMultipleData(args ? contract : null, 'pendingSushi', args)
  
    const userInfo = useSingleContractMultipleData(args ? contract : null, 'userInfo', args)
  
    // const pendingTokens = useSingleContractMultipleData(
    //     rewarder,
    //     'pendingTokens',
    //     args.map((arg) => [...arg, '0'])
    // )
  
    const getChef = useCallback(() => {
      if (MASTERCHEF_ADDRESSBOOK[chainId || 420] === contract!.address) {
        return Chef.MASTERCHEF
      } else {
        return Chef.MASTERCHEF_V2
      }
    }, [chainId, contract])
  
    return useMemo(() => {
      if (!pendingSushi && !userInfo) {
        return []
      }
      return zip(pendingSushi, userInfo)
        .map((data, i) => ({
          id: args[i][0],
          pendingSushi: data[0]?.result?.[0] || Zero,
          amount: data[1]?.result?.[0] || Zero,
          chef: getChef(),
          // pendingTokens: data?.[2]?.result,
        }))
        .filter(({ pendingSushi, amount }) => {
          return (pendingSushi && !pendingSushi.isZero()) || (amount && !amount.isZero())
        })
    }, [args, getChef, pendingSushi, userInfo])
  }
  