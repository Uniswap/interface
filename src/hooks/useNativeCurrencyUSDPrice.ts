import { gql, useQuery } from '@apollo/client'
import Decimal from 'decimal.js'
import { Price, USD } from 'dxswap-sdk'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useNativeCurrency } from './useNativeCurrency'

const QUERY = gql`
  query {
    bundle(id: "1") {
      nativeCurrencyPrice
    }
  }
`

export function useNativeCurrencyUSDPrice(): { loading: boolean; nativeCurrencyUSDPrice: Price } {
  const nativeCurrency = useNativeCurrency()
  const { loading, error, data } = useQuery<{ bundle: { nativeCurrencyPrice: string } }>(QUERY)

  return useMemo(() => {
    if (loading) return { loading: true, nativeCurrencyUSDPrice: new Price(nativeCurrency, USD, '1', '0') }
    if (!data || error) return { loading: false, nativeCurrencyUSDPrice: new Price(nativeCurrency, USD, '1', '0') }
    const [numerator, denominator] = new Decimal(data.bundle.nativeCurrencyPrice).toFraction(
      parseUnits('1', USD.decimals).toString()
    )
    return {
      loading: false,
      nativeCurrencyUSDPrice: new Price(nativeCurrency, USD, denominator.toFixed(0), numerator.toFixed(0))
    }
  }, [data, error, loading, nativeCurrency])
}
