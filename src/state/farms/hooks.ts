import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import { Interface } from '@ethersproject/abi'

import { exchangeCient } from 'apollo/client'
import { FARM_DATA, FARM_HISTORIES } from 'apollo/queries'
import { ChainId, WETH } from 'libs/sdk/src'
import FAIRLAUNCH_ABI from 'constants/abis/fairlaunch.json'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
import { Farm, FarmHistoriesSubgraphResult, FarmHistory, FarmHistoryMethod } from 'state/farms/types'
import { setFarmsData, setLoading, setError } from './actions'
import { useBlockNumber, useETHPrice } from 'state/application/hooks'
import { useActiveWeb3React } from 'hooks'
import { useFairLaunchContracts } from 'hooks/useContract'
import { FAIRLAUNCH_ADDRESSES, ZERO_ADDRESS } from '../../constants'
import { useAllTokens } from 'hooks/Tokens'
import { getBulkPoolData } from 'state/pools/hooks'
import { useMultipleContractSingleData } from 'state/multicall/hooks'

export const useFarms = (): Farm[] => {
  const farms = useSelector((state: AppState) => state.farms.data)
  return farms
}

export const useRewardTokens = () => {
  const { chainId } = useActiveWeb3React()
  const rewardTokensMulticallResult = useMultipleContractSingleData(
    FAIRLAUNCH_ADDRESSES[chainId as ChainId],
    new Interface(FAIRLAUNCH_ABI),
    'getRewardTokens'
  )

  return useMemo(() => {
    let result: string[] = []

    rewardTokensMulticallResult.forEach(token => {
      if (token?.result?.[0]) {
        result = result.concat(token?.result?.[0].filter((item: string) => result.indexOf(item) < 0))
      }
    })

    return result
  }, [rewardTokensMulticallResult])
}

export const fetchFarms = async (poolsList: string[], chainId?: ChainId) => {
  const result = await exchangeCient[chainId as ChainId].query({
    query: FARM_DATA,
    variables: {
      poolsList
    },
    fetchPolicy: 'network-only'
  })

  return result.data.pools
}

export const useFarmsData = () => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const fairLaunchContracts = useFairLaunchContracts()
  const ethPrice = useETHPrice()
  const allTokens = useAllTokens()
  const blockNumber = useBlockNumber()

  const farmsData = useSelector((state: AppState) => state.farms.data)
  const loading = useSelector((state: AppState) => state.farms.loading)
  const error = useSelector((state: AppState) => state.farms.error)

  useEffect(() => {
    async function getListFarmsForContract(contract: Contract): Promise<Farm[]> {
      const rewardTokenAddresses: string[] = await contract?.getRewardTokens()
      const poolLength = await contract?.poolLength()

      const pids = [...Array(BigNumber.from(poolLength).toNumber()).keys()]

      const poolInfos = await Promise.all(
        pids.map(async (pid: number) => {
          const poolInfo = await contract?.getPoolInfo(pid)

          return {
            ...poolInfo,
            pid
          }
        })
      )

      const stakedBalances = await Promise.all(
        pids.map(async (pid: number) => {
          const stakedBalance = account ? await contract?.getUserInfo(pid, account as string) : { amount: 0 }

          return stakedBalance.amount
        })
      )

      const pendingRewards = await Promise.all(
        pids.map(async (pid: number) => {
          const pendingRewards = account ? await contract?.pendingRewards(pid, account as string) : null

          return pendingRewards
        })
      )

      const poolAddresses = poolInfos.map(poolInfo => poolInfo.stakeToken.toLowerCase())

      const farmsData = await getBulkPoolData(poolAddresses, ethPrice.currentPrice, chainId)

      const rewardTokens = rewardTokenAddresses.map(address =>
        address.toLowerCase() === ZERO_ADDRESS.toLowerCase() ? WETH[chainId as ChainId] : allTokens[address]
      )

      const farms: Farm[] = poolInfos.map((poolInfo, index) => {
        return {
          ...farmsData.find(
            (farmData: Farm) => farmData && farmData.id.toLowerCase() === poolInfo.stakeToken.toLowerCase()
          ),
          ...poolInfo,
          rewardTokens,
          fairLaunchAddress: contract.address,
          userData: {
            stakedBalance: stakedBalances[index],
            rewards: pendingRewards[index]
          }
        }
      })
      return farms.filter(farm => !!farm.totalSupply)
    }

    async function checkForFarms() {
      try {
        if (!fairLaunchContracts) {
          return
        }

        dispatch(setLoading(true))

        const getListFarmsPromises: Promise<Farm[]>[] = []

        Object.keys(fairLaunchContracts).forEach(async (address: string) => {
          const fairLaunchContract = fairLaunchContracts[address]
          getListFarmsPromises.push(getListFarmsForContract(fairLaunchContract))
        })

        const farms: Farm[] = (await Promise.all(getListFarmsPromises)).flat()

        dispatch(setFarmsData({ farms }))
      } catch (error) {
        dispatch(setError(error as Error))
      }

      dispatch(setLoading(false))
    }

    checkForFarms()
  }, [dispatch, ethPrice.currentPrice, chainId, fairLaunchContracts, account, blockNumber])

  return { loading, error, data: farmsData }
}

export const useFarmHistories = (isModalOpen: boolean) => {
  const { chainId, account } = useActiveWeb3React()
  const [histories, setHistories] = useState<FarmHistory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchFarmHistories() {
      if (!account || !isModalOpen) {
        return
      }

      setLoading(true)

      try {
        const result = await exchangeCient[chainId as ChainId].query<FarmHistoriesSubgraphResult>({
          query: FARM_HISTORIES,
          variables: {
            user: account
          },
          fetchPolicy: 'network-only'
        })

        const historiesData: FarmHistory[] = []

        result.data.deposits.forEach(deposit => {
          historiesData.push({
            id: deposit.id,
            timestamp: deposit.timestamp,
            method: FarmHistoryMethod.DEPOSIT,
            amount: deposit.amount,
            stakeToken: deposit.stakeToken
          })
        })

        result.data.withdraws.forEach(withdraw => {
          historiesData.push({
            id: withdraw.id,
            timestamp: withdraw.timestamp,
            method: FarmHistoryMethod.WITHDRAW,
            amount: withdraw.amount,
            stakeToken: withdraw.stakeToken
          })
        })

        result.data.harvests.forEach(harvest => {
          const txHash = harvest.id.split('-')?.[0]

          const index = historiesData.findIndex(
            history =>
              history.method === FarmHistoryMethod.HARVEST &&
              history.rewardToken === harvest.rewardToken &&
              history.id.includes(txHash)
          )

          if (index < 0) {
            historiesData.push({
              id: harvest.id,
              timestamp: harvest.timestamp,
              method: FarmHistoryMethod.HARVEST,
              amount: harvest.amount,
              stakeToken: harvest.stakeToken,
              rewardToken: harvest.rewardToken
            })
          } else {
            historiesData[index].amount = BigNumber.from(historiesData[index].amount)
              .add(BigNumber.from(harvest.amount))
              .toString()
          }
        })

        result.data.vests.forEach(vest => {
          const txHash = vest.id.split('-')?.[0]

          const index = historiesData.findIndex(
            history =>
              history.method === FarmHistoryMethod.CLAIM &&
              history.rewardToken === vest.rewardToken &&
              history.id.includes(txHash)
          )

          if (index < 0) {
            historiesData.push({
              id: vest.id,
              timestamp: vest.timestamp,
              method: FarmHistoryMethod.CLAIM,
              amount: vest.amount,
              rewardToken: vest.rewardToken
            })
          } else {
            historiesData[index].amount = BigNumber.from(historiesData[index].amount)
              .add(BigNumber.from(vest.amount))
              .toString()
          }
        })

        historiesData.sort(function(a, b) {
          return parseInt(b.timestamp) - parseInt(a.timestamp)
        })

        setHistories(historiesData)
      } catch (err) {
        setHistories([])
      }

      setLoading(false)
    }

    fetchFarmHistories()
  }, [chainId, account, isModalOpen])

  return { loading, data: histories }
}
