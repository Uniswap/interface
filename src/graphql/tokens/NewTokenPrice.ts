import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import gql from 'graphql-tag'
import { getBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { PriceChartEntry } from 'types/chart'

import { apolloClient, blockClient } from '../thegraph/apollo'

const PRICE_CHART = gql`
  query tokenHourData($startTime: Int!, $skip: Int!, $address: Bytes!, $qtyDataPerTime: Int!) {
    tokenHourDatas(
      first: $qtyDataPerTime
      skip: $skip
      where: { token: $address, periodStartUnix_gt: $startTime }
      orderBy: periodStartUnix
      orderDirection: asc
    ) {
      periodStartUnix
      high
      low
      open
      close
    }
  }
`

const PRICE_DAY_CHART = gql`
  query tokenDayData($startTime: Int!, $skip: Int!, $address: Bytes!) {
    tokenHourDatas(
      first: 365
      skip: $skip
      where: { token: $address, periodStartUnix_gt: $startTime }
      orderBy: periodStartUnix
      orderDirection: asc
    ) {
      periodStartUnix
      high
      low
      open
      close
    }
  }
`
interface PriceResults {
  tokenHourDatas: {
    periodStartUnix: number
    high: string
    low: string
    open: string
    close: string
  }[]
}

// format dayjs with the libraries that we need
dayjs.extend(utc)
dayjs.extend(weekOfYear)

export async function fetchTokenPriceData(
  address: string,
  interval: number,
  startTimestamp: number,
  qtyDataPerTime: number
): Promise<{
  data: PriceChartEntry[]
  error: boolean
}> {
  // start and end bounds

  try {
    const endTimestamp = dayjs.utc().unix()

    if (!startTimestamp) {
      console.log('Error constructing price start timestamp')
      return {
        data: [],
        error: false,
      }
    }

    // create an array of hour start times until we reach current hour
    const timestamps = []
    let time = startTimestamp
    while (time <= endTimestamp) {
      timestamps.push(time)
      time += interval
    }

    // backout if invalid timestamp format
    if (timestamps.length === 0) {
      return {
        data: [],
        error: false,
      }
    }

    // fetch blocks based on timestamp
    const blocks = await getBlocksFromTimestamps(timestamps, blockClient, 500)

    if (!blocks || blocks.length === 0) {
      console.log('Error fetching blocks')
      return {
        data: [],
        error: false,
      }
    }

    let data: {
      periodStartUnix: number
      high: string
      low: string
      open: string
      close: string
    }[] = []
    let skip = 0
    let allFound = false
    while (!allFound) {
      const {
        data: priceData,
        errors,
        loading,
      } = qtyDataPerTime < 1000
        ? await apolloClient.query<PriceResults>({
            query: PRICE_CHART,
            variables: {
              address,
              startTime: startTimestamp,
              skip,
              qtyDataPerTime,
            },
            fetchPolicy: 'no-cache',
          })
        : await apolloClient.query<PriceResults>({
            query: PRICE_DAY_CHART,
            variables: {
              address,
              startTime: startTimestamp,
              skip,
            },
            fetchPolicy: 'no-cache',
          })

      if (!loading) {
        skip += 100
        if ((priceData && priceData.tokenHourDatas.length < 100) || errors) {
          allFound = true
        }
        if (priceData) {
          data = data.concat(priceData.tokenHourDatas)
        }
      }
    }

    const formattedHistory = data.map((d) => {
      return {
        time: d.periodStartUnix,
        open: parseFloat(d.open),
        close: parseFloat(d.close),
        high: parseFloat(d.high),
        low: parseFloat(d.low),
      }
    })

    return {
      data: formattedHistory,
      error: false,
    }
  } catch (e) {
    console.log(e)
    return {
      data: [],
      error: true,
    }
  }
}
