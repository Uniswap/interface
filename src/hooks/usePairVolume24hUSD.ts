import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { CurrencyAmount, USD } from '@swapr/sdk'
import { parseUnits } from 'ethers/lib/utils'
import { DateTime } from 'luxon'
import { useMemo } from 'react'
import { ZERO_USD } from '../constants'

const QUERY = gql`
  query getPair24hVolume($pairOrTokenAddress: ID!, $date: Int!) {
    pairDayDatas(first: 1, where: { pairAddress: $pairOrTokenAddress, date: $date }) {
      dailyVolumeUSD
    }
  }
`
const TOKENQUERY = gql`
  query getToken24hVolume($pairOrTokenAddress: ID!, $date: Int!) {
    tokenDayDatas(first: 1, where: { id: $pairOrTokenAddress, date: $date }) {
      dailyVolumeUSD
    }
  }
`

export function usePair24hVolumeUSD(
  pairOrTokenAddress?: string | null,
  isToken = false
): { loading: boolean; volume24hUSD: CurrencyAmount } {
  const { loading, data, error } = useQuery(isToken ? TOKENQUERY : QUERY, {
    variables: {
      pairOrTokenAddress: pairOrTokenAddress?.toLowerCase(),
      date: DateTime.utc()
        .startOf('day')
        .toSeconds()
    }
  })
  return useMemo(() => {
    if (loading) return { loading: true, volume24hUSD: ZERO_USD }
    if (
      !data ||
      (!isToken && (!data.pairDayDatas || data.pairDayDatas.length === 0 || !data.pairDayDatas[0])) ||
      (isToken && (!data.tokenDayDatas || data.tokenDayDatas.length === 0 || !data.tokenDayDatas[0])) ||
      error
    )
      return { loading: false, volume24hUSD: ZERO_USD }
    return {
      loading,
      volume24hUSD: CurrencyAmount.usd(
        parseUnits(
          new Decimal(isToken ? data.tokenDayDatas[0].dailyVolumeUSD : data.pairDayDatas[0].dailyVolumeUSD).toFixed(
            USD.decimals
          ),
          USD.decimals
        ).toString()
      )
    }
  }, [data, error, loading, isToken])
}
