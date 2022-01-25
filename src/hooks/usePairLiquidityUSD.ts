import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js-light'
import { CurrencyAmount, Pair, USD } from '@swapr/sdk'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { ZERO_USD } from '../constants'

const QUERY = gql`
  query($id: ID!) {
    pair(id: $id) {
      id
      reserveUSD
    }
  }
`

interface QueryResult {
  pair: { reserveUSD: string }
}

export function usePairLiquidityUSD(pair?: Pair | null): { loading: boolean; liquidityUSD: CurrencyAmount } {
  const { loading, data, error } = useQuery<QueryResult>(QUERY, {
    variables: { id: pair?.liquidityToken.address.toLowerCase() }
  })

  return useMemo(() => {
    if (loading) return { loading: true, liquidityUSD: ZERO_USD }
    if (!data || !data.pair || !data.pair.reserveUSD || error) return { loading, liquidityUSD: ZERO_USD }
    return {
      loading,
      liquidityUSD: CurrencyAmount.usd(
        parseUnits(new Decimal(data.pair.reserveUSD).toFixed(USD.decimals), USD.decimals).toString()
      )
    }
  }, [data, error, loading])
}
