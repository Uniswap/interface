import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'

import { ChainId, Token } from '@dynamic-amm/sdk'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import { FAIRLAUNCH_ADDRESSES } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useRewardLockerContracts } from 'hooks/useContract'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { useRewardTokensFullInfo } from 'utils/dmm'
import { setLoading, setSchedulesByRewardLocker } from './actions'

export const useRewardLockerAddresses = () => {
  const { chainId } = useActiveWeb3React()
  const rewardLockerAddressesMulticallResult = useMultipleContractSingleData(
    FAIRLAUNCH_ADDRESSES[chainId as ChainId],
    new Interface(FAIRLAUNCH_ABI),
    'rewardLocker'
  )

  return useMemo(() => {
    let result: string[] = []

    rewardLockerAddressesMulticallResult.forEach(address => {
      if (address?.result) {
        result = result.concat(address?.result.filter((item: string) => result.indexOf(item) < 0))
      }
    })

    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(rewardLockerAddressesMulticallResult)])
}

export const useRewardTokensByRewardLocker = () => {
  const { chainId } = useActiveWeb3React()

  const rewardTokensMulticallResult = useMultipleContractSingleData(
    FAIRLAUNCH_ADDRESSES[chainId as ChainId],
    new Interface(FAIRLAUNCH_ABI),
    'getRewardTokens'
  )

  const rewardLockerAddressesMulticallResult = useMultipleContractSingleData(
    FAIRLAUNCH_ADDRESSES[chainId as ChainId],
    new Interface(FAIRLAUNCH_ABI),
    'rewardLocker'
  )

  const fairLaunchToTokensMapping: { [key: string]: string[] } = {}
  const fairLaunchToRewardLockerMapping: { [key: string]: string } = {}

  rewardTokensMulticallResult.forEach((token, index) => {
    fairLaunchToTokensMapping[FAIRLAUNCH_ADDRESSES[chainId as ChainId][index]] = token?.result?.[0]
  })

  rewardLockerAddressesMulticallResult.forEach((address, index) => {
    fairLaunchToRewardLockerMapping[FAIRLAUNCH_ADDRESSES[chainId as ChainId][index]] = address?.result?.[0]
  })

  // Get the mapping between reward locker => reward tokens
  return useMemo(() => {
    const result: { [key: string]: string[] } = {}

    Object.keys(fairLaunchToRewardLockerMapping).forEach(fairLaunchAddress => {
      const rewardLockerAddress = fairLaunchToRewardLockerMapping[fairLaunchAddress]
      const rewardTokens = fairLaunchToTokensMapping[fairLaunchAddress]

      if (result[rewardLockerAddress]) {
        result[rewardLockerAddress] = result[rewardLockerAddress].concat(
          rewardTokens.filter((item: string) => result[rewardLockerAddress].indexOf(item) < 0)
        )
      } else {
        result[rewardLockerAddress] = rewardTokens
      }
    })

    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(fairLaunchToRewardLockerMapping), JSON.stringify(fairLaunchToTokensMapping)])
}

export const useSchedules = () => {
  const dispatch = useAppDispatch()
  const { account } = useActiveWeb3React()
  const rewardLockerAddresses = useRewardLockerAddresses()
  const rewardTokensByRewardLocker = useRewardTokensByRewardLocker()
  const rewardLockerContracts = useRewardLockerContracts()
  const rewardTokensFullInfo = useRewardTokensFullInfo()

  const schedulesByRewardLocker = useSelector<
    AppState,
    { [key: string]: [BigNumber, BigNumber, BigNumber, BigNumber, Token, number][] }
  >(state => state.vesting.schedulesByRewardLocker)

  useEffect(() => {
    const fetchSchedules = async (account: string): Promise<any> => {
      dispatch(setLoading(true))
      try {
        const result: { [key: string]: [BigNumber, BigNumber, BigNumber, BigNumber, Token, number][] } = {}

        for (let i = 0; i < rewardLockerAddresses.length; i++) {
          const rewardLockerAddress = rewardLockerAddresses[i]
          const rewardLockerContract = rewardLockerContracts?.[rewardLockerAddress]
          const rewardTokenAddresses = rewardTokensByRewardLocker[rewardLockerAddress]
          const rewardTokens = rewardTokensFullInfo.filter(t => rewardTokenAddresses.includes(t.address))

          const promises = rewardTokens
            .filter(token => !!token)
            .map(async token => {
              const res = await rewardLockerContract?.getVestingSchedules(account, token.address)
              return res.map((s: any, index: any) => [...s, token, index])
            })

          const res = await Promise.all(promises)

          result[rewardLockerAddress] = res.flat()
        }

        dispatch(setSchedulesByRewardLocker(result))
      } catch (err) {
        console.error(err)
      }

      dispatch(setLoading(false))
    }

    if (account && rewardLockerContracts) {
      fetchSchedules(account)
    }
  }, [
    account,
    dispatch,
    rewardLockerAddresses,
    rewardLockerContracts,
    rewardTokensByRewardLocker,
    rewardTokensFullInfo
  ])

  return { schedulesByRewardLocker }
}
