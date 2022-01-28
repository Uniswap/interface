import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { CurrencyAmount, Pair, USD } from '@swapr/sdk'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { ZERO_USD } from '../constants'

const QUERY = gql`
  query($id: ID!, $timestamp: BigInt!) {
    pair(id: $id) {
      id
      reserveUSD
      liquidityMiningCampaigns(where: { endsAt_gt: $timestamp }) {
        id
      }
    }
  }
`

interface QueryResult {
  pair: { reserveUSD: string; liquidityMiningCampaigns: { id: string }[] }
}

export function usePairCampaignIndicatorAndLiquidityUSD(
  pair?: Pair | null
): { loading: boolean; liquidityUSD: CurrencyAmount; numberOfCampaigns: number } {
  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])

  const { loading, data, error } = useQuery<QueryResult>(QUERY, {
    variables: { id: pair?.liquidityToken.address.toLowerCase(), timestamp: timestamp }
  })

  return useMemo(() => {
    if (loading) return { loading: true, liquidityUSD: ZERO_USD, numberOfCampaigns: 0 }
    if (!data || !data.pair || !data.pair.reserveUSD || error || !data.pair.liquidityMiningCampaigns)
      return { loading, liquidityUSD: ZERO_USD, numberOfCampaigns: 0 }
    return {
      loading,
      liquidityUSD: CurrencyAmount.usd(
        parseUnits(new Decimal(data.pair.reserveUSD).toFixed(USD.decimals), USD.decimals).toString()
      ),
      numberOfCampaigns: data.pair.liquidityMiningCampaigns.length
    }
  }, [data, error, loading])
}
