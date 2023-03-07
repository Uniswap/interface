import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Contract } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import FAIRLAUNCH_V2_ABI from 'constants/abis/fairlaunch-v2.json'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import REWARD_LOCKER_V2_ABI from 'constants/abis/reward-locker-v2.json'
import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useMultipleContracts, useRewardLockerContracts } from 'hooks/useContract'
import { AppState } from 'state'
import { RewardLockerVersion } from 'state/farms/classic/types'
import { useElasticFarms } from 'state/farms/elastic/hooks'
import { useAppDispatch } from 'state/hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useRewardTokensFullInfo } from 'utils/dmm'

import { setLoading, setSchedulesByRewardLocker } from './actions'

export const useRewardLockerAddressesWithVersion = (): { [rewardLockerAddress: string]: RewardLockerVersion } => {
  const { networkInfo } = useActiveWeb3React()

  const fairLaunchAddresses = useMemo(() => (networkInfo as EVMNetworkInfo).classic.fairlaunch || [], [networkInfo])
  const fairLaunchV2Addresses = useMemo(() => (networkInfo as EVMNetworkInfo).classic.fairlaunchV2 || [], [networkInfo])
  const fairLaunchInterface = useMemo(() => new Interface(FAIRLAUNCH_ABI), [])
  const fairLaunchV2Interface = useMemo(() => new Interface(FAIRLAUNCH_V2_ABI), [])

  const rewardLockerAddressesV1MulticallResult = useMultipleContractSingleData(
    fairLaunchAddresses,
    fairLaunchInterface,
    'rewardLocker',
  )
  const rewardLockerAddressesV2MulticallResult = useMultipleContractSingleData(
    fairLaunchV2Addresses,
    fairLaunchV2Interface,
    'rewardLocker',
  )

  return useMemo(() => {
    const result: { [rewardLockerAddress: string]: RewardLockerVersion } = {}

    rewardLockerAddressesV2MulticallResult.forEach(callState => {
      callState.result &&
        callState.result.forEach(address => {
          if (result[address] === undefined) result[address] = RewardLockerVersion.V2
        })
    })

    rewardLockerAddressesV1MulticallResult.forEach(callState => {
      callState.result &&
        callState.result.forEach(address => {
          if (result[address] === undefined) result[address] = RewardLockerVersion.V1
        })
    })

    return result
  }, [rewardLockerAddressesV1MulticallResult, rewardLockerAddressesV2MulticallResult])
}

const useRewardTokensByRewardLocker = () => {
  const { isEVM, networkInfo } = useActiveWeb3React()

  /**
   * Both V1 and V2 contain `getRewardTokens` and `rewardLocker`
   */
  const fairLaunchAddresses = useMemo(
    () =>
      isEVM
        ? [
            ...(networkInfo as EVMNetworkInfo).classic.fairlaunch,
            ...(networkInfo as EVMNetworkInfo).classic.fairlaunchV2,
          ]
        : [],
    [isEVM, networkInfo],
  )
  const fairLaunchInterface = useMemo(() => new Interface(FAIRLAUNCH_ABI), [])

  const rewardTokensMulticallResult = useMultipleContractSingleData(
    fairLaunchAddresses,
    fairLaunchInterface,
    'getRewardTokens',
  )

  const rewardLockerAddressesMulticallResult = useMultipleContractSingleData(
    fairLaunchAddresses,
    fairLaunchInterface,
    'rewardLocker',
  )

  const fairLaunchToTokensMapping: { [key: string]: string[] } = useMemo(() => {
    const res: { [key: string]: string[] } = {}
    rewardTokensMulticallResult.forEach((token, index) => {
      res[fairLaunchAddresses[index]] = token?.result?.[0]
    })
    return res
  }, [rewardTokensMulticallResult, fairLaunchAddresses])

  const fairLaunchToRewardLockerMapping: { [key: string]: string } = useMemo(() => {
    const res: { [key: string]: string } = {}
    rewardLockerAddressesMulticallResult.forEach((address, index) => {
      res[fairLaunchAddresses[index]] = address?.result?.[0]
    })
    return res
  }, [rewardLockerAddressesMulticallResult, fairLaunchAddresses])

  // Get the mapping between reward locker => reward tokens
  return useMemo(() => {
    const result: { [key: string]: string[] } = {}

    Object.keys(fairLaunchToRewardLockerMapping).forEach(fairLaunchAddress => {
      const rewardLockerAddress = fairLaunchToRewardLockerMapping[fairLaunchAddress]
      const rewardTokens = fairLaunchToTokensMapping[fairLaunchAddress]

      if (result[rewardLockerAddress]) {
        result[rewardLockerAddress] = result[rewardLockerAddress].concat(
          rewardTokens.filter((item: string) => result[rewardLockerAddress].indexOf(item) < 0),
        )
      } else {
        result[rewardLockerAddress] = rewardTokens
      }
    })

    return result
  }, [fairLaunchToRewardLockerMapping, fairLaunchToTokensMapping])
}

export const useSchedules = () => {
  const dispatch = useAppDispatch()
  const { account } = useActiveWeb3React()
  const rewardLockerAddressesWithVersion = useRewardLockerAddressesWithVersion()
  const rewardTokensByRewardLocker = useRewardTokensByRewardLocker()
  const rewardLockerContracts = useRewardLockerContracts()
  const rewardTokensFullInfo = useRewardTokensFullInfo()

  const schedulesByRewardLocker = useSelector<
    AppState,
    { [key: string]: [BigNumber, BigNumber, BigNumber, BigNumber, Token, number, RewardLockerVersion][] }
  >(state => state.vesting.schedulesByRewardLocker)

  useEffect(() => {
    const fetchSchedules = async (account: string): Promise<any> => {
      dispatch(setLoading(true))
      try {
        const result: {
          [key: string]: [BigNumber, BigNumber, BigNumber, BigNumber, Token, number, RewardLockerVersion][]
        } = {}

        for (let i = 0; i < Object.keys(rewardLockerAddressesWithVersion).length; i++) {
          const rewardLockerAddress = Object.keys(rewardLockerAddressesWithVersion)[i]
          const rewardLockerVersion = rewardLockerAddressesWithVersion[rewardLockerAddress]
          const rewardLockerContract = rewardLockerContracts?.[rewardLockerAddress]
          const rewardTokenAddresses = rewardTokensByRewardLocker[rewardLockerAddress]
          const rewardTokens = rewardTokensFullInfo.filter(t => rewardTokenAddresses.includes(t.address))

          const promises = rewardTokens
            .filter(token => !!token)
            .map(async token => {
              const res = await rewardLockerContract?.getVestingSchedules(account, token.address)
              return res.map((s: any, index: any) => [...s, token, index, rewardLockerVersion])
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
    rewardLockerAddressesWithVersion,
    rewardLockerContracts,
    rewardTokensByRewardLocker,
    rewardTokensFullInfo,
  ])

  return { schedulesByRewardLocker }
}

export interface Schedule {
  startTime: number
  endTime: number
  index: number
  token: Token
  vestedQuantity: BigNumber
  quantity: BigNumber
  tokenPrice: number
  contract: Contract
}

export const usePrommSchedules = () => {
  const { account } = useActiveWeb3React()
  const { farms, loading: farmLoading } = useElasticFarms()

  const rewardTokenMap = useMemo(() => {
    const addresses: { [address: string]: Currency } = {}
    farms?.forEach(farm => {
      farm.pools.forEach(pool => {
        pool.rewardTokens.forEach(tk => (addresses[tk.wrapped.address] = tk))
      })
    })
    return addresses
  }, [farms])

  const prices = useTokenPrices(Object.keys(rewardTokenMap))

  const rewardTokensByRewardLocker: { [rewardLocker: string]: string[] } = useMemo(() => {
    const temp: { [rewardLocker: string]: string[] } = {}

    farms?.forEach(farm => {
      farm.pools.forEach(pool => {
        const rl = farm.rewardLocker
        if (!temp[rl]) temp[rl] = []
        temp[rl] = [...new Set(temp[rl].concat(pool.rewardTokens.map(rw => rw.wrapped.address)))]
      })
    })
    return temp
  }, [farms])

  const rewardLockerAddresses = useMemo(() => Object.keys(rewardTokensByRewardLocker), [rewardTokensByRewardLocker])
  const rewardLockerContracts = useMultipleContracts(rewardLockerAddresses, REWARD_LOCKER_V2_ABI)

  const [schedulesByRewardLocker, setSchedules] = useState<{ [address: string]: Schedule[] }>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getVestingSchedules = async () => {
      const temp: {
        [address: string]: Array<Schedule>
      } = {}
      if (!rewardLockerContracts || !account) return

      setLoading(true)
      for (let i = 0; i < rewardLockerAddresses.length; i++) {
        const address = rewardLockerAddresses[i]
        const contract = rewardLockerContracts[address]

        const schedules = await Promise.all(
          rewardTokensByRewardLocker[address]
            .filter(tokenAddress => !!rewardTokenMap[tokenAddress])
            .map(async token => {
              const res = await contract.getVestingSchedules(account, token)
              return res.map((item: any, index: number) => ({
                ...item,
                startTime: item.startTime.toNumber(),
                endTime: item.endTime.toNumber(),
                index,
                token: rewardTokenMap[token],
                tokenPrice: prices[token] || 0,
                contract,
              }))
            }),
        )

        temp[address] = schedules.flat()
      }

      setLoading(false)
      setSchedules(temp)
    }

    getVestingSchedules()
  }, [prices, rewardLockerContracts, account, rewardLockerAddresses, rewardTokensByRewardLocker, rewardTokenMap])

  return {
    schedulesByRewardLocker,
    loading: loading || farmLoading,
  }
}
