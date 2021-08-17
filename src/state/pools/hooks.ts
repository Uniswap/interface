import { useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { useDispatch, useSelector } from 'react-redux'
import { useDeepCompareEffect } from 'react-use'

import { exchangeCient } from 'apollo/client'
import { POOL_DATA, POOLS_BULK, POOLS_HISTORICAL_BULK, USER_POSITIONS } from 'apollo/queries'
import { ChainId, Currency } from 'libs/sdk/src'
import { AppState } from '../index'
import { updatePools, setLoading, setError } from './actions'
import { getPercentChange, getTimestampsForChanges, getBlocksFromTimestamps, get24hValue } from 'utils'
import { useActiveWeb3React } from 'hooks'

export interface SubgraphPoolData {
  id: string
  reserveUSD: string
  volumeUSD: string
  feeUSD: string
  oneDayVolumeUSD: string
  oneDayVolumeUntracked: string
  oneDayFeeUSD: string
  oneDayFeeUntracked: string
}

export interface UserLiquidityPosition {
  id: string
  liquidityTokenBalance: string
  pool: {
    id: string
    token0: {
      id: string
    }
    token1: {
      id: string
    }
    reserveUSD: string
    totalSupply: string
  }
}

export interface UserLiquidityPositionResult {
  loading: boolean
  error: any
  data: {
    liquidityPositions: UserLiquidityPosition[]
  }
}

/**
 * Get my liquidity for all pools
 *
 * @param user string
 */
export function useUserLiquidityPositions(user: string | null | undefined): UserLiquidityPositionResult {
  const { loading, error, data } = useQuery(USER_POSITIONS, {
    variables: {
      user: user?.toLowerCase()
    },
    fetchPolicy: 'no-cache'
  })

  return { loading, error, data }
}

function parseData(data: any, oneDayData: any, ethPrice: any, oneDayBlock: any, chainId?: ChainId): SubgraphPoolData {
  // get volume changes
  const oneDayVolumeUSD = get24hValue(data?.volumeUSD, oneDayData?.volumeUSD ? oneDayData.volumeUSD : 0)

  const oneDayFeeUSD = get24hValue(data?.feeUSD, oneDayData?.feeUSD ? oneDayData.feeUSD : 0)
  const oneDayVolumeUntracked = get24hValue(
    data?.untrackedVolumeUSD,
    oneDayData?.untrackedVolumeUSD ? parseFloat(oneDayData?.untrackedVolumeUSD) : 0
  )
  const oneDayFeeUntracked = get24hValue(
    data?.untrackedFeeUSD,
    oneDayData?.untrackedFeeUSD ? parseFloat(oneDayData?.untrackedFeeUSD) : 0
  )

  // set volume properties
  data.oneDayVolumeUSD = oneDayVolumeUSD
  data.oneDayFeeUSD = oneDayFeeUSD
  data.oneDayFeeUntracked = oneDayFeeUntracked
  data.oneDayVolumeUntracked = oneDayVolumeUntracked

  // set liquiditry properties
  data.trackedReserveUSD = data.trackedReserveETH * ethPrice
  data.liquidityChangeUSD = getPercentChange(data.reserveUSD, oneDayData?.reserveUSD)

  // format if pool hasnt existed for a day or a week
  if (!oneDayData && data && data.createdAtBlockNumber > oneDayBlock) {
    data.oneDayVolumeUSD = parseFloat(data.volumeUSD)
  }
  if (!oneDayData && data) {
    data.oneDayVolumeUSD = parseFloat(data.volumeUSD)
  }

  if (chainId === ChainId.MAINNET) {
    if (data?.token0?.id === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
      data.token0 = { ...data.token0, name: 'Ether (Wrapped)', symbol: 'ETH' }
    }

    if (data?.token1?.id === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
      data.token1 = { ...data.token1, name: 'Ether (Wrapped)', symbol: 'ETH' }
    }
  }

  if (chainId === ChainId.MATIC) {
    if (data?.token0?.id === '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270') {
      data.token0 = { ...data.token0, name: 'Matic (Wrapped)', symbol: 'MATIC' }
    }

    if (data?.token1?.id === '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270') {
      data.token1 = { ...data.token1, name: 'Matic (Wrapped)', symbol: 'MATIC' }
    }

    if (data?.token0?.id === '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619') {
      data.token0 = { ...data.token0, name: 'Ether (Wrapped)', symbol: 'ETH' }
    }

    if (data?.token1?.id === '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619') {
      data.token1 = { ...data.token1, name: 'Ether (Wrapped)', symbol: 'ETH' }
    }
  }

  return data
}

export async function getBulkPoolData(poolList: string[], ethPrice?: string, chainId?: ChainId): Promise<any> {
  try {
    const current = await exchangeCient[chainId as ChainId].query({
      query: POOLS_BULK,
      variables: {
        allPools: poolList
      },
      fetchPolicy: 'network-only'
    })
    let poolData
    const [t1] = getTimestampsForChanges()
    const blocks = await getBlocksFromTimestamps([t1], chainId)
    if (blocks.length == 0) {
      return current.data.pools
    } else {
      const [{ number: b1 }] = blocks

      const [oneDayResult] = await Promise.all(
        [b1].map(async block => {
          const result = exchangeCient[chainId as ChainId].query({
            query: POOLS_HISTORICAL_BULK(block, poolList),
            fetchPolicy: 'network-only'
          })
          return result
        })
      )

      const oneDayData = oneDayResult?.data?.pools.reduce((obj: any, cur: any) => {
        return { ...obj, [cur.id]: cur }
      }, {})

      poolData = await Promise.all(
        current &&
          current.data.pools.map(async (pool: any) => {
            let data = { ...pool }
            let oneDayHistory = oneDayData?.[pool.id]
            if (!oneDayHistory) {
              const newData = await exchangeCient[chainId as ChainId].query({
                query: POOL_DATA(pool.id, b1),
                fetchPolicy: 'network-only'
              })
              oneDayHistory = newData.data.pools[0]
            }

            data = parseData(data, oneDayHistory, ethPrice, b1, chainId)

            return data
          })
      )
    }

    return poolData
  } catch (e) {
    console.error(e)
    throw e
  }
}

export function useBulkPoolData(
  poolList: (string | undefined)[],
  ethPrice?: string
): {
  loading: AppState['pools']['loading']
  error: AppState['pools']['error']
  data: AppState['pools']['pools']
} {
  const dispatch = useDispatch()
  const { chainId } = useActiveWeb3React()

  const poolsData = useSelector((state: AppState) => state.pools.pools)
  const loading = useSelector((state: AppState) => state.pools.loading)
  const error = useSelector((state: AppState) => state.pools.error)

  useDeepCompareEffect(() => {
    async function checkForPools() {
      try {
        if (poolList.length > 0 && !error && poolsData.length === 0) {
          dispatch(setLoading(true))
          const pools = await getBulkPoolData(poolList as string[], ethPrice, chainId)
          dispatch(updatePools({ pools }))
        }
      } catch (error) {
        dispatch(setError(error))
      }

      dispatch(setLoading(false))
    }

    checkForPools()
  }, [dispatch, ethPrice, error, poolList, poolsData.length])

  return { loading, error, data: poolsData }
}

export function useResetPools(currencyA: Currency | undefined, currencyB: Currency | undefined) {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(updatePools({ pools: [] }))
    dispatch(setError(undefined))
  }, [currencyA, currencyB, dispatch])
}

export function useSelectedPool() {
  return useSelector((state: AppState) => state.pools.selectedPool)
}
