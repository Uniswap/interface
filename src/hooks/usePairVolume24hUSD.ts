import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { CurrencyAmount, Pair, USD } from '@swapr/sdk'
import { parseUnits } from 'ethers/lib/utils'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import { ZERO_USD } from '../constants'

const QUERY = gql`
  query getPair24hVolume($pairAddress: ID!, $date: Int!) {
    pairDayDatas(first: 1, where: { pairAddress: $pairAddress, date: $date }) {
      dailyVolumeUSD
    }
  }
`

interface QueryResult {
  pairDayDatas: { dailyVolumeUSD: string }[]
}

export function usePair24hVolumeUSD(pair?: Pair | null): { loading: boolean; volume24hUSD: CurrencyAmount } {
  const { loading, data, error } = useQuery<QueryResult>(QUERY, {
    variables: {
      pairAddress: pair?.liquidityToken.address.toLowerCase(),
      date: DateTime.utc()
        .startOf('day')
        .toSeconds()
    }
  })

  return useMemo(() => {
    if (loading) return { loading: true, volume24hUSD: ZERO_USD }
    if (!data || !data.pairDayDatas || data.pairDayDatas.length === 0 || !data.pairDayDatas[0] || error)
      return { loading: false, volume24hUSD: ZERO_USD }
    return {
      loading,
      volume24hUSD: CurrencyAmount.usd(
        parseUnits(new Decimal(data.pairDayDatas[0].dailyVolumeUSD).toFixed(USD.decimals), USD.decimals).toString()
      )
    }
  }, [data, error, loading])
}
