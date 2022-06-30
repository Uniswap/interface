import { useEffect, useMemo, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'

import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import FAIRLAUNCH_V2_ABI from 'constants/abis/fairlaunch-v2.json'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useRewardLockerContracts, useMultipleContracts } from 'hooks/useContract'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'
import { useRewardTokensFullInfo } from 'utils/dmm'
import { setLoading, setSchedulesByRewardLocker } from './actions'
import { RewardLockerVersion } from 'state/farms/types'
import { useProMMFarms, useGetProMMFarms } from 'state/farms/promm/hooks'
import { useTokens } from 'hooks/Tokens'
import { useTokensPrice } from 'state/application/hooks'
import REWARD_LOCKER_V2_ABI from 'constants/abis/reward-locker-v2.json'
import { Contract } from 'ethers'
import { VERSION } from 'constants/v2'
import { NETWORKS_INFO } from 'constants/networks'

export const useRewardLockerAddressesWithVersion = (): { [rewardLockerAddress: string]: RewardLockerVersion } => {
  const { chainId } = useActiveWeb3React()

  const fairLaunchAddresses = useMemo(() => NETWORKS_INFO[chainId || ChainId.MAINNET].classic.fairlaunch, [chainId])
  const fairLaunchV2Addresses = useMemo(() => NETWORKS_INFO[chainId || ChainId.MAINNET].classic.fairlaunchV2, [chainId])
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

export const useRewardTokensByRewardLocker = () => {
  const { chainId } = useActiveWeb3React()

  /**
   * Both V1 and V2 contain `getRewardTokens` and `rewardLocker`
   */
  const fairLaunchAddresses = useMemo(
    () => [
      ...NETWORKS_INFO[chainId || ChainId.MAINNET].classic.fairlaunch,
      ...NETWORKS_INFO[chainId || ChainId.MAINNET].classic.fairlaunchV2,
    ],
    [chainId],
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
  const { data: farms, loading: farmLoading } = useProMMFarms()
  const getProMMFarm = useGetProMMFarms()

  const firstRender = useRef(true)

  useEffect(() => {
    if (!Object.keys(farms).length && firstRender.current) {
      getProMMFarm()
      firstRender.current = false
    }
  }, [farms, getProMMFarm])

  const rewardTokenAddresses = useMemo(() => {
    const addresses: { [address: string]: 1 } = {}
    Object.values(farms).forEach(farms => {
      farms.forEach(farm => {
        farm.rewardTokens.forEach(tk => (addresses[tk] = 1))
      })
    })
    return Object.keys(addresses)
  }, [farms])

  const rwTokenMap = useTokens(rewardTokenAddresses)

  const tokens = useMemo(() => {
    return Object.values(rwTokenMap)
  }, [rwTokenMap])

  const prices = useTokensPrice(tokens, VERSION.ELASTIC)

  const tokenPriceMap = useMemo(() => {
    return prices.reduce((priceMap, price, index) => {
      return {
        ...priceMap,
        [tokens[index]?.isNative ? ZERO_ADDRESS : tokens[index]?.address]: price,
      }
    }, {} as { [address: string]: number })
  }, [prices, tokens])

  const rewardTokensByRewardLocker = useMemo(() => {
    const temp: { [rewardLocker: string]: string[] } = {}

    Object.values(farms).forEach(farms => {
      farms.forEach(farm => {
        const rl = farm.rewardLocker
        if (!temp[rl]) temp[rl] = []
        temp[rl] = [...new Set(temp[rl].concat(farm.rewardTokens))]
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
            .filter(token => !!rwTokenMap[token])
            .map(async token => {
              const res = await contract.getVestingSchedules(account, token)
              return res.map((item: any, index: number) => ({
                ...item,
                startTime: item.startTime.toNumber(),
                endTime: item.endTime.toNumber(),
                index,
                token: rwTokenMap[token],
                tokenPrice: tokenPriceMap[token] || 0,
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
  }, [tokenPriceMap, rewardLockerContracts, account, rewardLockerAddresses, rewardTokensByRewardLocker, rwTokenMap])

  return {
    schedulesByRewardLocker,
    loading: loading || farmLoading,
  }
}
