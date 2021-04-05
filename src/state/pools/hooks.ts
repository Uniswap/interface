import { useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { useDispatch, useSelector } from 'react-redux'
import { useDeepCompareEffect } from 'react-use'

import { client } from 'apollo/client'
import { USER_LIQUIDITY_POSITION_SNAPSHOTS, POOL_DATA, POOLS_BULK, POOLS_HISTORICAL_BULK } from 'apollo/queries'
import { Currency } from 'libs/sdk/src'
import { AppState } from '../index'
import { updatePools, setLoading, setError } from './actions'
import { getPercentChange, getTimestampsForChanges, getBlocksFromTimestamps, get2DayPercentChange } from 'utils'

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
  liquidityTokenTotalSupply: string
  reserveUSD: string
  timestamp: number
  pool: {
    id: string
  }
}

/**
 * Get my liquidity for all pools
 *
 * @param account string
 */
export function useUserLiquidityPositions(account: string | null | undefined) {
  const { loading, error, data } = useQuery(USER_LIQUIDITY_POSITION_SNAPSHOTS, {
    variables: {
      account: account?.toLowerCase()
    }
  })

  return { loading, error, data }
}

function parseData(
  data: any,
  oneDayData: any,
  twoDayData: any,
  oneWeekData: any,
  ethPrice: any,
  oneDayBlock: any
): SubgraphPoolData {
  // get volume changes
  const [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
    data?.volumeUSD,
    oneDayData?.volumeUSD ? oneDayData.volumeUSD : 0,
    twoDayData?.volumeUSD ? twoDayData.volumeUSD : 0
  )

  const [oneDayFeeUSD, feeChangeUSD] = get2DayPercentChange(
    data?.feeUSD,
    oneDayData?.feeUSD ? oneDayData.feeUSD : 0,
    twoDayData?.feeUSD ? twoDayData.feeUSD : 0
  )
  const [oneDayVolumeUntracked, volumeChangeUntracked] = get2DayPercentChange(
    data?.untrackedVolumeUSD,
    oneDayData?.untrackedVolumeUSD ? parseFloat(oneDayData?.untrackedVolumeUSD) : 0,
    twoDayData?.untrackedVolumeUSD ? twoDayData?.untrackedVolumeUSD : 0
  )
  const [oneDayFeeUntracked, feeChangeUntracked] = get2DayPercentChange(
    data?.untrackedFeeUSD,
    oneDayData?.untrackedFeeUSD ? parseFloat(oneDayData?.untrackedFeeUSD) : 0,
    twoDayData?.untrackedFeeUSD ? twoDayData?.untrackedFeeUSD : 0
  )
  const oneWeekVolumeUSD = parseFloat(oneWeekData ? data?.volumeUSD - oneWeekData?.volumeUSD : data.volumeUSD)

  // set volume properties
  data.oneDayVolumeUSD = oneDayVolumeUSD
  data.oneWeekVolumeUSD = oneWeekVolumeUSD
  data.oneDayFeeUSD = oneDayFeeUSD
  data.oneDayFeeUntracked = oneDayFeeUntracked
  data.volumeChangeUSD = volumeChangeUSD
  data.oneDayVolumeUntracked = oneDayVolumeUntracked
  data.volumeChangeUntracked = volumeChangeUntracked

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
  if (!oneWeekData && data) {
    data.oneWeekVolumeUSD = parseFloat(data.volumeUSD)
  }
  if (data?.token0?.id === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
    data.token0 = { ...data.token0, name: 'Ether (Wrapped)' }
    // data.token0.name = 'Ether (Wrapped)'
    data.token0.symbol = 'ETH'
  }
  if (data?.token1?.id === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
    data.token1 = { ...data.token1, name: 'Ether (Wrapped)' }
    // data.token1.name = 'Ether (Wrapped)'
    data.token1.symbol = 'ETH'
  }

  return data
}

export async function getBulkPoolData(poolList: string[], ethPrice?: string): Promise<any> {
  const [t1, t2, tWeek] = getTimestampsForChanges()
  const [{ number: b1 }, { number: b2 }, { number: bWeek }] = await getBlocksFromTimestamps([t1, t2, tWeek])

  try {
    const current = await client.query({
      query: POOLS_BULK,
      variables: {
        allPools: poolList
      },
      fetchPolicy: 'network-only'
    })

    const [oneDayResult, twoDayResult, oneWeekResult] = await Promise.all(
      [b1, b2, bWeek].map(async block => {
        const result = client.query({
          query: POOLS_HISTORICAL_BULK(block, poolList),
          fetchPolicy: 'network-only'
        })
        return result
      })
    )

    const oneDayData = oneDayResult?.data?.pools.reduce((obj: any, cur: any, i: any) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    const twoDayData = twoDayResult?.data?.pools.reduce((obj: any, cur: any, i: any) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    const oneWeekData = oneWeekResult?.data?.pools.reduce((obj: any, cur: any, i: any) => {
      return { ...obj, [cur.id]: cur }
    }, {})

    const poolData = await Promise.all(
      current &&
        current.data.pools.map(async (pool: any) => {
          let data = { ...pool }
          let oneDayHistory = oneDayData?.[pool.id]
          if (!oneDayHistory) {
            const newData = await client.query({
              query: POOL_DATA(pool.id, b1),
              fetchPolicy: 'network-only'
            })
            oneDayHistory = newData.data.pools[0]
          }
          let twoDayHistory = twoDayData?.[pool.id]
          if (!twoDayHistory) {
            const newData = await client.query({
              query: POOL_DATA(pool.id, b2),
              fetchPolicy: 'network-only'
            })
            twoDayHistory = newData.data.pools[0]
          }
          let oneWeekHistory = oneWeekData?.[pool.id]
          if (!oneWeekHistory) {
            const newData = await client.query({
              query: POOL_DATA(pool.id, bWeek),
              fetchPolicy: 'network-only'
            })
            oneWeekHistory = newData.data.pools[0]
          }
          data = parseData(data, oneDayHistory, twoDayHistory, oneWeekHistory, ethPrice, b1)

          return data
        })
    )

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

  const poolsData = useSelector((state: AppState) => state.pools.pools)
  const loading = useSelector((state: AppState) => state.pools.loading)
  const error = useSelector((state: AppState) => state.pools.error)

  useDeepCompareEffect(() => {
    async function checkForPools() {
      try {
        if (poolList.length > 0 && !error && poolsData.length === 0) {
          dispatch(setLoading(true))
          const pools = await getBulkPoolData(poolList as string[], ethPrice)
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
