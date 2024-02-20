import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError, skipToken } from '@reduxjs/toolkit/query/react'
import { useTranslation } from 'react-i18next'
import { Delay } from 'src/components/layout/Delayed'
import { ColorTokens } from 'ui/src'
import { NumberType } from 'utilities/src/format/types'
import { useDebounce } from 'utilities/src/time/timing'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import {
  FiatCurrencyInfo,
  useAppFiatCurrencyInfo,
  useFiatCurrencyInfo,
} from 'wallet/src/features/fiatCurrency/hooks'
import { useFiatOnRampAggregatorCryptoQuoteQuery } from 'wallet/src/features/fiatOnRamp/api'
import { FORQuote } from 'wallet/src/features/fiatOnRamp/types'
import {
  isFiatOnRampApiError,
  isInvalidRequestAmountTooHigh,
  isInvalidRequestAmountTooLow,
} from 'wallet/src/features/fiatOnRamp/utils'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

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
  const walletAddress = useActiveAccountAddress()

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
          walletAddress: walletAddress ?? '',
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

export function useParseFiatOnRampError(
  error: unknown,
  currencyCode: string
): {
  errorText: string | undefined
  errorColor: ColorTokens | undefined
} {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  let errorText, errorColor: ColorTokens | undefined

  if (!isFiatOnRampApiError(error)) {
    return { errorText, errorColor }
  }

  if (isInvalidRequestAmountTooLow(error)) {
    const formattedAmount = formatNumberOrString({
      value: error.data.context.minimumAllowed,
      type: NumberType.FiatStandard,
      currencyCode,
    })
    errorText = t('Minimum {{amount}}', { amount: formattedAmount })
    errorColor = '$statusCritical'
  } else if (isInvalidRequestAmountTooHigh(error)) {
    const formattedAmount = formatNumberOrString({
      value: error.data.context.maximumAllowed,
      type: NumberType.FiatStandard,
      currencyCode,
    })
    errorText = t('Maximum {{amount}}', { amount: formattedAmount })
    errorColor = '$statusCritical'
  } else {
    errorText = t('Something went wrong.')
    errorColor = '$DEP_accentWarning'
  }

  return { errorText, errorColor }
}
