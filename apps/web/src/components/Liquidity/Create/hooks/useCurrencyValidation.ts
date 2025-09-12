import { Currency } from '@uniswap/sdk-core'
import { createCurrencyParsersWithValidation } from 'components/Liquidity/parsers/urlParsers'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrencyWithLoading } from 'hooks/Tokens'
import { useMemo } from 'react'

export function useCurrencyValidation({
  currencyA,
  currencyB,
  defaultInitialToken,
  chainId,
}: {
  currencyA?: string
  currencyB?: string
  defaultInitialToken: Currency
  chainId: number
}) {
  // Parse currency addresses with validation
  const { currencyAddressA, currencyAddressB } = useMemo(() => {
    const currencyValidation = createCurrencyParsersWithValidation(chainId)
    return currencyValidation.validateCurrencies(currencyA, currencyB)
  }, [currencyA, currencyB, chainId])

  // Load currencies
  const { currency: currencyALoaded, loading: loadingA } = useCurrencyWithLoading({
    address: currencyAddressA,
    chainId,
  })
  const { currency: currencyBLoaded, loading: loadingB } = useCurrencyWithLoading({
    address: currencyAddressB,
    chainId,
  })

  const loading = loadingA || loadingB

  if (!loading && !currencyALoaded && !currencyBLoaded) {
    return {
      currencyAddressA: defaultInitialToken.isNative ? NATIVE_CHAIN_ID : defaultInitialToken.address,
      currencyAddressB: undefined,
      currencyALoaded: defaultInitialToken,
      currencyBLoaded: undefined,
      loading: false,
    }
  }

  return {
    currencyAddressA,
    currencyAddressB,
    currencyALoaded,
    currencyBLoaded,
    loading: loadingA || loadingB,
  }
}
