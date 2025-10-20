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
  const defaultAAddress = defaultInitialToken.isNative ? NATIVE_CHAIN_ID : defaultInitialToken.address

  if (!loading && !currencyALoaded) {
    // If no currencies are loaded, return the default initial token
    if (!currencyBLoaded) {
      return {
        currencyAddressA: defaultAAddress,
        currencyAddressB: undefined,
        currencyALoaded: defaultInitialToken,
        currencyBLoaded: undefined,
        loadingA,
        loadingB,
        loading: false,
      }
    }

    // If currencyB is loaded, and it's not the default initial token, return currencyB
    // and the default initial token
    if (!currencyBLoaded.equals(defaultInitialToken)) {
      return {
        currencyAddressA: defaultAAddress,
        currencyAddressB,
        currencyALoaded: defaultInitialToken,
        currencyBLoaded,
        loadingA,
        loadingB,
        loading: false,
      }
    }
  }

  return {
    currencyAddressA,
    currencyAddressB,
    currencyALoaded,
    currencyBLoaded,
    loadingA,
    loadingB,
    loading,
  }
}
