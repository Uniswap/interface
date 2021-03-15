import { useQuery } from '@apollo/client'
import Decimal from 'decimal.js'
import { Price, USD } from 'dxswap-sdk'
import { parseUnits } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { GET_NATIVE_CURRENCY_USD_PRICE } from '../apollo/queries'
import { useNativeCurrency } from './useNativeCurrency'

export function useNativeCurrencyUSDPrice(): { loading: boolean; nativeCurrencyUSDPrice: Price } {
  const nativeCurrency = useNativeCurrency()
  const { loading, error, data } = useQuery(GET_NATIVE_CURRENCY_USD_PRICE)

  return useMemo(() => {
    if (loading || error) return { loading: false, nativeCurrencyUSDPrice: new Price(nativeCurrency, USD, '1', '0') }
    const [numerator, denominator] = new Decimal(data.bundle.nativeCurrencyPrice).toFraction(
      parseUnits('1', USD.decimals).toString()
    )
    return {
      loading: false,
      nativeCurrencyUSDPrice: new Price(nativeCurrency, USD, denominator.toFixed(0), numerator.toFixed(0))
    }
  }, [data, error, loading, nativeCurrency])
}
