import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError, skipToken } from '@reduxjs/toolkit/query/react'
import { useTranslation } from 'react-i18next'
import { Delay } from 'src/components/layout/Delayed'
import { ColorTokens } from 'ui/src'
import { useDebounce } from 'utilities/src/time/timing'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import {
  FiatCurrencyInfo,
  useAppFiatCurrencyInfo,
  useFiatCurrencyInfo,
} from 'wallet/src/features/fiatCurrency/hooks'
import { useFiatOnRampAggregatorCryptoQuoteQuery } from 'wallet/src/features/fiatOnRamp/api'
import { extractCurrencyAmountFromError, isMeldApiError } from 'wallet/src/features/fiatOnRamp/meld'
import { FORQuote } from 'wallet/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

// TODO: https://linear.app/uniswap/issue/MOB-2532/implement-fetching-of-available-fiat-currencies-from-meld
const MELD_FIAT_CURRENCY_CODES = ['usd', 'eur']

export function useMeldFiatCurrencySupportInfo(): {
  appFiatCurrencySupportedInMeld: boolean
  meldSupportedFiatCurrency: FiatCurrencyInfo
} {
  // Not all the currencies are supported by Meld, so we need to fallback to USD if the currency is not supported
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const fallbackCurrencyInfo = useFiatCurrencyInfo(FiatCurrency.UnitedStatesDollar)
  const appFiatCurrencyCode = appFiatCurrencyInfo.code.toLowerCase()

  const appFiatCurrencySupported = MELD_FIAT_CURRENCY_CODES.includes(appFiatCurrencyCode)
  const currency = appFiatCurrencySupported ? appFiatCurrencyInfo : fallbackCurrencyInfo

  return {
    appFiatCurrencySupportedInMeld: appFiatCurrencySupported,
    meldSupportedFiatCurrency: currency,
  }
}

/**
 * Hook to load quotes
 */
export function useFiatOnRampQuotes({
  baseCurrencyAmount,
  baseCurrencyCode,
  quoteCurrencyCode,
  countryCode,
}: {
  baseCurrencyAmount?: number
  baseCurrencyCode: string | undefined
  quoteCurrencyCode: string | undefined
  countryCode: string | undefined
}): {
  loading: boolean
  error?: FetchBaseQueryError | SerializedError
  quotes: FORQuote[] | undefined
} {
  const debouncedBaseCurrencyAmount = useDebounce(baseCurrencyAmount, Delay.Short)

  const {
    currentData: quotesResponse,
    isFetching: quotesFetching,
    error: quotesError,
  } = useFiatOnRampAggregatorCryptoQuoteQuery(
    baseCurrencyAmount && countryCode && quoteCurrencyCode && baseCurrencyCode
      ? {
          sourceAmount: baseCurrencyAmount,
          sourceCurrencyCode: baseCurrencyCode,
          destinationCurrencyCode: quoteCurrencyCode,
          countryCode,
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: true,
    }
  )

  const loading = quotesFetching || debouncedBaseCurrencyAmount !== baseCurrencyAmount

  // if user is entering base amount -> ignore previous errors
  const error = debouncedBaseCurrencyAmount !== baseCurrencyAmount ? undefined : quotesError

  return {
    loading,
    error,
    quotes: quotesResponse?.quotes ?? undefined,
  }
}

export function useParseMeldError(error: unknown): {
  errorText: string | undefined
  errorColor: ColorTokens | undefined
} {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  let errorText, errorColor: ColorTokens | undefined

  if (!isMeldApiError(error)) {
    return { errorText, errorColor }
  }

  if (error.data.code === 'INVALID_AMOUNT_TOO_LOW') {
    const formattedAmount = extractCurrencyAmountFromError(error.data.message, formatNumberOrString)
    errorText = t('Minimum {{amount}}', { amount: formattedAmount })
    errorColor = '$statusCritical'
  } else if (error.data.code === 'INVALID_AMOUNT_TOO_HIGH') {
    const formattedAmount = extractCurrencyAmountFromError(error.data.message, formatNumberOrString)
    errorText = t('Maximum {{amount}}', { amount: formattedAmount })
    errorColor = '$statusCritical'
  } else {
    errorText = t('Something went wrong.')
    errorColor = '$DEP_accentWarning'
  }

  return { errorText, errorColor }
}
