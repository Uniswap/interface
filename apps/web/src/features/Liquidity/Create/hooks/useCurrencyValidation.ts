import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { createCurrencyParsersWithValidation } from '~/features/Liquidity/parsers/urlParsers'
import { useCurrencyWithLoading } from '~/hooks/currency/useCurrencyWithLoading'

export function useCurrencyValidation({
  currencyA,
  currencyB,
  defaultInitialToken,
  chainId,
  skip,
}: {
  currencyA?: string
  currencyB?: string
  defaultInitialToken: Currency
  chainId: number
  /**
   * Defers the token lookups entirely. `useCurrencyWithLoading` resolves `chainId` through
   * `useSupportedChainId`, so while a chain reads as not-enabled it would look the address up on the
   * default chain instead — a wrong-chain request whose result also masks the real one, because the
   * data-api query keeps the previous key's data as placeholder and so reports `loading: false` when
   * the chain later resolves and the key changes.
   */
  skip?: boolean
}) {
  // Parse currency addresses with validation
  const { currencyAddressA, currencyAddressB } = useMemo(() => {
    const currencyValidation = createCurrencyParsersWithValidation(chainId)
    return currencyValidation.validateCurrencies(currencyA, currencyB)
  }, [currencyA, currencyB, chainId])

  // Load currencies
  const { currency: currencyALoaded, loading: loadingA } = useCurrencyWithLoading(
    { address: currencyAddressA, chainId },
    { skip },
  )
  const { currency: currencyBLoaded, loading: loadingB } = useCurrencyWithLoading(
    { address: currencyAddressB, chainId },
    { skip },
  )

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
