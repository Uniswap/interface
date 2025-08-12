import { createCurrencyParsersWithValidation } from 'components/Liquidity/parsers/urlParsers'
import { useCurrencyWithLoading } from 'hooks/Tokens'
import { useMemo } from 'react'

export function useCurrencyValidation({
  currencyA,
  currencyB,
  chainId,
}: {
  currencyA?: string
  currencyB?: string
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

  return {
    currencyAddressA,
    currencyAddressB,
    currencyALoaded,
    currencyBLoaded,
    loading: loadingA || loadingB,
  }
}
