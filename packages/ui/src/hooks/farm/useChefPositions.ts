import { Zero } from '@ethersproject/constants'
import { Chef } from 'constants/farm/chef.enum'
import { MASTERCHEF_ADDRESSBOOK, MINICHEF_ADDRESS } from 'constants/index'
import { BigNumber, Contract } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { zip } from 'lodash'
import { useCallback, useMemo } from 'react'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'

export function useChefPositions(contract?: Contract | null, rewarder?: Contract | null, chainId = 420) {
  const { account } = useActiveWeb3React()

  const poolLength: BigNumber | undefined = useSingleCallResult(
    contract ? contract : null,
    'poolLength',
    undefined,
    NEVER_RELOAD
  )?.result?.[0]

  console.debug('useChefPositions::poolLength', poolLength?.toString())

  const args = useMemo(() => {
    if (!account || !poolLength) {
      return
    }
    return [...Array(poolLength.toNumber()).keys()].map((pid) => [String(pid), String(account)])
  }, [poolLength, account])

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
    } else if (MASTERCHEF_ADDRESSBOOK[chainId] === contract!.address) {
      return Chef.MASTERCHEF_V2
    } else if (MINICHEF_ADDRESS[chainId] === contract!.address) {
      return Chef.MINICHEF
    }
    return undefined
  }, [chainId, contract])

  return useMemo(() => {
    if (!pendingSushi && !userInfo) {
      return []
    }
    return zip(pendingSushi, userInfo).map((data, i) => ({
      // @todo: possible undefined
      id: (args as string[][])[i][0],
      pendingSushi: data[0]?.result?.[0] || Zero,
      amount: data[1]?.result?.[0] || Zero,
      chef: getChef(),
      rewardDebt: data[1]?.result?.[1] || Zero
      // pendingTokens: data?.[2]?.result,
    }))
    // .filter(({ pendingSushi, amount }) => {
    //   return (pendingSushi && !pendingSushi.isZero()) || (amount && !amount.isZero())
    // })
  }, [args, getChef, pendingSushi, userInfo])
}
