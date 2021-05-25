import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { BigNumber } from '@ethersproject/bignumber'

import { client } from 'apollo/client'
import { FARM_DATA } from 'apollo/queries'
import { AppState, useAppDispatch } from 'state'
import { Farm, FarmUserData } from 'state/farms/types'
import { setFarmsPublicData, setLoading, setError } from './actions'
import { useETHPrice } from 'state/application/hooks'
import useMasterChef from 'hooks/useMasterchef'
import {
  useFarmUserAllowances,
  useFarmUserEarnings,
  useFarmUserStakedBalances,
  useFarmUserTokenBalances
} from './fetchFarmUser'

export const useFarms = (): Farm[] => {
  const farms = useSelector((state: AppState) => state.farms.data)
  return farms
}

export const fetchFarms = async (poolsList: string[]) => {
  const result = await client.query({
    query: FARM_DATA,
    variables: {
      poolsList
    },
    fetchPolicy: 'network-only'
  })

  return result.data.pools
}

export const useFarmsPublicData = () => {
  const dispatch = useAppDispatch()
  const { getPoolLength, getPoolInfo } = useMasterChef()
  const ethPrice = useETHPrice()

  const farmsData = useSelector((state: AppState) => state.farms.data)
  const loading = useSelector((state: AppState) => state.farms.loading)
  const error = useSelector((state: AppState) => state.farms.error)

  const handleGetPoolLength = useCallback(async () => {
    const poolLength = await getPoolLength()

    return BigNumber.from(poolLength).toNumber()
  }, [getPoolLength])

  useEffect(() => {
    async function checkForFarms() {
      try {
        dispatch(setLoading(true))

        const poolLength = await handleGetPoolLength()
        const pids = [...Array(poolLength).keys()]

        const poolInfos = await Promise.all(
          pids.map(async (pid: number) => {
            const poolInfo = await getPoolInfo(pid)

            return {
              ...poolInfo,
              pid
            }
          })
        )

        const poolAddresses = poolInfos.map(poolInfo => poolInfo.stakeToken.toLowerCase())

        const farmsData = await fetchFarms(poolAddresses)

        const farms = poolInfos.map(poolInfo => ({
          ...farmsData.find(
            (farmData: Farm) => farmData && farmData.id.toLowerCase() === poolInfo.stakeToken.toLowerCase()
          ),
          ...poolInfo
        }))

        dispatch(setFarmsPublicData({ farms }))
      } catch (error) {
        dispatch(setError(error))
      }

      dispatch(setLoading(false))
    }

    checkForFarms()
  }, [dispatch, ethPrice.currentPrice, handleGetPoolLength, getPoolInfo])

  return { loading, error, data: farmsData }
}

export const useFarmsUserData = (account: string | null | undefined, farmsToFetch: Farm[]) => {
  const { loading: tokenBalancesLoading, data: userFarmTokenBalances } = useFarmUserTokenBalances(account, farmsToFetch)
  const { loading: userFarmAllowancesLoading, data: userFarmAllowances } = useFarmUserAllowances(account, farmsToFetch)
  const { loading: userStakedBalancesLoading, data: userStakedBalances } = useFarmUserStakedBalances(
    account,
    farmsToFetch
  )
  const { loading: userFarmEarningsLoading, data: userFarmEarnings } = useFarmUserEarnings(account, farmsToFetch)

  const data: FarmUserData[] = userFarmAllowances.map((farmAllowance, index) => {
    return {
      pid: farmsToFetch[index].pid,
      allowance: userFarmAllowances[index],
      tokenBalance: userFarmTokenBalances[index],
      stakedBalance: userStakedBalances[index],
      earnings: userFarmEarnings[index]
    }
  })

  return {
    loading: tokenBalancesLoading || userFarmAllowancesLoading || userStakedBalancesLoading || userFarmEarningsLoading,
    data
  }
}
