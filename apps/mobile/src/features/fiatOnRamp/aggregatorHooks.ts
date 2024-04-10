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
import {
  useFiatOnRampAggregatorCryptoQuoteQuery,
  useFiatOnRampAggregatorSupportedFiatCurrenciesQuery,
} from 'wallet/src/features/fiatOnRamp/api'
import { FORQuote } from 'wallet/src/features/fiatOnRamp/types'
import {
  isFiatOnRampApiError,
  isInvalidRequestAmountTooHigh,
  isInvalidRequestAmountTooLow,
} from 'wallet/src/features/fiatOnRamp/utils'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function useMeldFiatCurrencySupportInfo(countryCode: string): {
  appFiatCurrencySupportedInMeld: boolean
  meldSupportedFiatCurrency: FiatCurrencyInfo
} {
  // Not all the currencies are supported by Meld, so we need to fallback to USD if the currency is not supported
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const fallbackCurrencyInfo = useFiatCurrencyInfo(FiatCurrency.UnitedStatesDollar)
  const appFiatCurrencyCode = appFiatCurrencyInfo.code.toLowerCase()

  const { data: supportedFiatCurrencies } = useFiatOnRampAggregatorSupportedFiatCurrenciesQuery({
    countryCode,
  })

  const appFiatCurrencySupported =
    !supportedFiatCurrencies ||
    supportedFiatCurrencies.fiatCurrencies.some(
      (currency): boolean => appFiatCurrencyCode === currency.fiatCurrencyCode.toLowerCase()
    )
  const meldSupportedFiatCurrency = appFiatCurrencySupported
    ? appFiatCurrencyInfo
    : fallbackCurrencyInfo

  return {
    appFiatCurrencySupportedInMeld: appFiatCurrencySupported,
    meldSupportedFiatCurrency,
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
  if (!error) {
    return { errorText, errorColor }
  }

  errorText = t('fiatOnRamp.error.default')
  errorColor = '$DEP_accentWarning'

  if (isFiatOnRampApiError(error)) {
    if (isInvalidRequestAmountTooLow(error)) {
      const formattedAmount = formatNumberOrString({
        value: error.data.context.minimumAllowed,
        type: NumberType.FiatStandard,
        currencyCode,
      })
      errorText = t('fiatOnRamp.error.min', { amount: formattedAmount })
      errorColor = '$statusCritical'
    } else if (isInvalidRequestAmountTooHigh(error)) {
      const formattedAmount = formatNumberOrString({
        value: error.data.context.maximumAllowed,
        type: NumberType.FiatStandard,
        currencyCode,
      })
      errorText = t('fiatOnRamp.error.max', { amount: formattedAmount })
      errorColor = '$statusCritical'
    }
  }

  return { errorText, errorColor }
}
