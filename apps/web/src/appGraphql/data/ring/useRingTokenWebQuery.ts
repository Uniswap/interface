/* eslint-disable import/no-unused-modules */
import { ErrorPolicy, useQuery } from '@apollo/client'
import gql from 'graphql-tag'

import { useQueryClient } from 'appGraphql/data/apollo/client'
import { RingHistoryDuration } from 'appGraphql/data/util'
import { UTCTimestamp } from 'lightweight-charts'
import { useMemo } from 'react'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const TOKEN_DETAIL = () => {
  const queryString = `
    query tokenDetail($id: String!, $dayWhere: tokenDayDataFilter, $hourWhere: tokenHourDataFilter){
      token(id: $id) {
        id
        chain
        name
        symbol
        decimals
        address
        standard
        totalValueLocked
        totalValueLockedUSD
        derivedETH
        tradeVolumeUSD
        v4WhitelistPools
        v3WhitelistPools
        originToken {
          address
          name
          symbol
          decimals
          standard
        }
        dayData(orderBy: "date", orderDirection: "desc", where: $dayWhere, limit: 365) {
          items {
            id
            date
            dayId
            priceUSD
            volumeUSD
            totalValueLockedUSD
            protocolVersion
            open
            high
            low
            close
          }
        }
        hourData(orderBy: "date", orderDirection: "desc", where: $hourWhere, limit: 720) {
          items {
            id
            date
            dayId
            priceUSD
            volumeUSD
            totalValueLockedUSD
            protocolVersion
            open
            high
            low
            close
          }
        }
      }
    }
  `
  return gql(queryString)
}

export function useRingTokenWebQuery({
  variables,
  errorPolicy = 'all',
}: {
  variables: { address: string; chain: Chain }
  errorPolicy?: ErrorPolicy
}) {
  const client = useQueryClient(variables.chain)
  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])

  // if (!variables.address || variables.address.trim() === '') {
  //   return { data: null, loading: false, error: undefined }
  // }

  // day/week/month data before 30*24 hours
  // year data before 365 days
  const hourWhere = {
    date_gte: String(timestamp - 30 * 24 * 60 * 60),
  }
  const dayWhere = {
    date_gte: String(timestamp - 365 * 24 * 60 * 60),
  }

  const tokenId = `Token:${variables.chain}_${variables.address.toLowerCase()}`

  return useQuery(TOKEN_DETAIL(), {
    variables: {
      id: tokenId,
      dayWhere,
      hourWhere,
    },
    errorPolicy,
    fetchPolicy: 'cache-and-network',
    client,
  })
}

export function useTokenDetail(tokenAddress: string, chain: Chain) {
  const { data, loading, error } = useRingTokenWebQuery({ variables: { address: tokenAddress, chain } })

  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])

  const token = data?.token ?? null

  return { token, loading, error, timestamp }
}

function aggregateVolumes(
  data: { date: string; volumeUSD: string }[],
  intervalInSeconds: number,
): { date: string; volumeUSD: string }[] {
  if (!data.length) {
    return []
  }
  const sorted = [...data].sort((a, b) => Number(a.date) - Number(b.date))
  const result: { date: string; volumeUSD: string }[] = []

  let bucketStart = Math.floor(Number(sorted[0].date) / intervalInSeconds) * intervalInSeconds
  let sum = 0

  for (const item of sorted) {
    const currentBucket = Math.floor(Number(item.date) / intervalInSeconds) * intervalInSeconds
    if (currentBucket === bucketStart) {
      sum += Number(item.volumeUSD)
    } else {
      result.push({ date: String(bucketStart), volumeUSD: String(sum) })
      bucketStart = currentBucket
      sum = Number(item.volumeUSD)
    }
  }

  result.push({ date: String(bucketStart), volumeUSD: String(sum) })

  return result
}

export function useRingTokenHistoricalVolumesQuery(tokenAddress: string, chain: Chain, duration: RingHistoryDuration) {
  const { token, loading, timestamp } = useTokenDetail(tokenAddress, chain)
  const SECONDS_IN_HOUR = 3600
  const SECONDS_IN_DAY = 86400

  const baseData =
    duration === RingHistoryDuration.Day || duration === RingHistoryDuration.Week
      ? token?.hourData?.items
      : token?.dayData?.items

  if (!baseData) {
    return { historicalVolume: [], loading }
  }

  let filtered: { date: string; volumeUSD: string }[] = []

  if (duration === RingHistoryDuration.Day) {
    filtered = baseData.filter((v: any) => v && Number(v.date) >= timestamp - SECONDS_IN_DAY)
  } else if (duration === RingHistoryDuration.Week) {
    const weekData = baseData.filter((v: any) => v && Number(v.date) >= timestamp - 7 * SECONDS_IN_DAY)
    const FOUR_HOURS = 4 * SECONDS_IN_HOUR
    const aggregated = aggregateVolumes(weekData, FOUR_HOURS)
    filtered = aggregated
  } else if (duration === RingHistoryDuration.Month) {
    filtered = baseData.filter((v: any) => v && Number(v.date) >= timestamp - 30 * SECONDS_IN_DAY)
  } else if (duration === RingHistoryDuration.Year) {
    const yearData = baseData.filter((v: any) => v && Number(v.date) >= timestamp - 365 * SECONDS_IN_DAY)
    const SEVEN_DAYS = 7 * SECONDS_IN_DAY
    const aggregated = aggregateVolumes(yearData, SEVEN_DAYS)
    filtered = aggregated
  }

  const historicalVolume =
    filtered
      .map((v: any) => ({
        timestamp: Number(v.date) as UTCTimestamp,
        value: Number(v.volumeUSD),
      }))
      .sort((a, b) => a.timestamp - b.timestamp) ?? []

  return { historicalVolume, loading }
}

export function useRingTokenHistoricalTvlsQuery(tokenAddress: string, chain: Chain, duration: RingHistoryDuration) {
  const { token, loading, timestamp } = useTokenDetail(tokenAddress, chain)
  const SECONDS_IN_DAY = 86400

  const tvl =
    duration === RingHistoryDuration.Day
      ? token?.hourData?.items.filter(
          (v: any): v is { date: string; totalValueLockedUSD: string } =>
            v !== undefined && Number(v.date) >= timestamp - 1 * SECONDS_IN_DAY,
        ) ?? []
      : duration === RingHistoryDuration.Week
        ? token?.hourData?.items.filter(
            (v: any): v is { date: string; totalValueLockedUSD: string } =>
              v !== undefined && Number(v.date) >= timestamp - 7 * SECONDS_IN_DAY,
          ) ?? []
        : duration === RingHistoryDuration.Month
          ? token?.dayData?.items.filter(
              (v: any): v is { date: string; totalValueLockedUSD: string } =>
                v !== undefined && Number(v.date) >= timestamp - 30 * SECONDS_IN_DAY,
            ) ?? []
          : duration === RingHistoryDuration.Year
            ? token?.dayData?.items.filter(
                (v: any): v is { date: string; totalValueLockedUSD: string } =>
                  v !== undefined && Number(v.date) >= timestamp - 365 * SECONDS_IN_DAY,
              ) ?? []
            : []
  const historicalTvl =
    tvl
      .filter((v: any): v is { date: string; totalValueLockedUSD: string } => v !== undefined)
      .map((v: any) => ({
        timestamp: Number(v.date) as UTCTimestamp,
        value: Number(v.totalValueLockedUSD),
      }))
      .sort((a: any, b: any) => a.timestamp - b.timestamp) ?? []

  return { historicalTvl, loading, totalValueLocked: Number(token?.totalValueLockedUSD) ?? 0 }
}
