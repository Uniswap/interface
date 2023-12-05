import { Currency } from '@uniswap/sdk-core'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Delay } from 'src/components/layout/Delayed'
import { IS_ANDROID } from 'src/constants/globals'
import { ColorTokens, useSporeColors } from 'ui/src'
import { useDebounce } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import {
  FiatCurrencyInfo,
  useAppFiatCurrencyInfo,
  useFiatCurrencyInfo,
} from 'wallet/src/features/fiatCurrency/hooks'
import {
  useFiatOnRampBuyQuoteQuery,
  useFiatOnRampIpAddressQuery,
  useFiatOnRampLimitsQuery,
  useFiatOnRampSupportedTokensQuery,
  useFiatOnRampWidgetUrlQuery,
} from 'wallet/src/features/fiatOnRamp/api'
import { MoonpayCurrency } from 'wallet/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { addTransaction } from 'wallet/src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { getFormattedCurrencyAmount } from 'wallet/src/utils/currency'
import { ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function useFormatExactCurrencyAmount(
  currencyAmount: string,
  currency: Maybe<Currency>
): string | undefined {
  const formatter = useLocalizationContext()

  if (!currencyAmount || !currency) return

  const formattedAmount = getFormattedCurrencyAmount(
    currency,
    currencyAmount,
    formatter,
    true,
    ValueType.Exact
  )

  return formattedAmount === '' ? '0' : formattedAmount
}

/** Returns a new externalTransactionId and a callback to store the transaction. */
export function useFiatOnRampTransactionCreator(ownerAddress: string): {
  externalTransactionId: string
  dispatchAddTransaction: () => void
} {
  const dispatch = useAppDispatch()

  const externalTransactionId = useRef(createTransactionId())

  const dispatchAddTransaction = useCallback(() => {
    // adds a dummy transaction detail for now
    // later, we will attempt to look up information for that id
    const transactionDetail: TransactionDetails = {
      chainId: ChainId.Mainnet,
      id: externalTransactionId.current,
      from: ownerAddress,
      typeInfo: { type: TransactionType.FiatPurchase, syncedWithBackend: false },
      status: TransactionStatus.Pending,
      addedTime: Date.now(),
      hash: '',
      options: { request: {} },
    }
    // use addTransaction action so transactionWatcher picks it up
    dispatch(addTransaction(transactionDetail))
  }, [dispatch, externalTransactionId, ownerAddress])

  return { externalTransactionId: externalTransactionId.current, dispatchAddTransaction }
}

const MOONPAY_FEES_INCLUDED = true
// MoonPay supported fiat currencies (https://support.moonpay.com/hc/en-gb/articles/360011931457-Which-fiat-currencies-are-supported-)
const MOONPAY_FIAT_CURRENCY_CODES = [
  'aud', // Australian Dollar
  'bgn', // Bulgarian Lev
  'brl', // Brazilian Real
  'cad', // Canadian Dollar
  'chf', // Swiss Franc
  'cny', // Chinese Yuan
  'cop', // Colombia Peso
  'czk', // Czech Koruna
  'dkk', // Danish Krone
  'dop', // Dominican Peso
  'egp', // Egyptian Pound
  'eur', // Euro
  'gbp', // Pound Sterling
  'hkd', // Hong Kong Dollar
  'idr', // Indonesian Rupiah
  'ils', // Israeli New Shekel
  'jpy', // Japanese Yen
  'jod', // Jordanian Dollar
  'kes', // Kenyan Shilling
  'krw', // South Korean Won
  'kwd', // Kuwaiti Dinar
  'lkr', // Sri Lankan Rupee
  'mad', // Moroccan Dirham
  'mxn', // Mexican Peso
  'ngn', // Nigerian Naira
  'nok', // Norwegian Krone
  'nzd', // New Zealand Dollar
  'omr', // Omani Rial
  'pen', // Peruvian Sol
  'pkr', // Pakistani Rupee
  'pln', // Polish Złoty
  'ron', // Romanian Leu
  'sek', // Swedish Krona
  'thb', // Thai Baht
  'try', // Turkish Lira
  'twd', // Taiwan Dollar
  'usd', // US Dollar
  'vnd', // Vietnamese Dong
  'zar', // South African Rand
]

export function useMoonpayFiatCurrencySupportInfo(): {
  appFiatCurrencySupportedInMoonpay: boolean
  moonpaySupportedFiatCurrency: FiatCurrencyInfo
} {
  // Not all the currencies are supported by MoonPay, so we need to fallback to USD if the currency is not supported
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const fallbackCurrencyInfo = useFiatCurrencyInfo(FiatCurrency.UnitedStatesDollar)
  const appFiatCurrencyCode = appFiatCurrencyInfo.code.toLowerCase()

  const appFiatCurrencySupported = MOONPAY_FIAT_CURRENCY_CODES.includes(appFiatCurrencyCode)
  const currency = appFiatCurrencySupported ? appFiatCurrencyInfo : fallbackCurrencyInfo

  return {
    appFiatCurrencySupportedInMoonpay: appFiatCurrencySupported,
    moonpaySupportedFiatCurrency: currency,
  }
}
/**
 * Hook to provide data from Moonpay for Fiat On Ramp Input Amount screen.
 */
export function useMoonpayFiatOnRamp({
  baseCurrencyAmount,
  quoteCurrencyCode,
}: {
  baseCurrencyAmount: string
  quoteCurrencyCode: string
}): {
  eligible: boolean
  quoteAmount: number
  quoteCurrencyAmountReady: boolean
  quoteCurrencyAmountLoading: boolean
  isLoading: boolean
  externalTransactionId: string
  dispatchAddTransaction: () => void
  fiatOnRampHostUrl?: string
  isError: boolean
  errorText?: string
  errorColor?: ColorTokens
} {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const debouncedBaseCurrencyAmount = useDebounce(baseCurrencyAmount, Delay.Short)

  // we can consider adding `ownerAddress` as a prop to this modal in the future
  // for now, always assume the user wants to fund the current account
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const { externalTransactionId, dispatchAddTransaction } =
    useFiatOnRampTransactionCreator(activeAccountAddress)

  const { moonpaySupportedFiatCurrency: baseCurrency } = useMoonpayFiatCurrencySupportInfo()
  const baseCurrencyCode = baseCurrency.code.toLowerCase()
  const baseCurrencySymbol = baseCurrency.symbol

  const {
    data: limitsData,
    isLoading: limitsLoading,
    isError: limitsLoadingQueryError,
  } = useFiatOnRampLimitsQuery({
    baseCurrencyCode,
    quoteCurrencyCode,
    areFeesIncluded: MOONPAY_FEES_INCLUDED,
  })

  const { maxBuyAmount } = limitsData?.baseCurrency ?? {
    maxBuyAmount: Infinity,
  }

  // we're adding +1 here because MoonPay API is not precise with limits
  // and an actual lower limit is a bit above the number, they provide in limits api
  const minBuyAmount = limitsData?.baseCurrency?.minBuyAmount
    ? limitsData.baseCurrency.minBuyAmount + 1
    : 0

  const parsedBaseCurrencyAmount = parseFloat(baseCurrencyAmount)
  const amountIsTooSmall = parsedBaseCurrencyAmount < minBuyAmount
  const amountIsTooLarge = parsedBaseCurrencyAmount > maxBuyAmount
  const isBaseCurrencyAmountValid =
    !!parsedBaseCurrencyAmount && !amountIsTooSmall && !amountIsTooLarge

  const {
    data: fiatOnRampHostUrl,
    isError: isWidgetUrlQueryError,
    isLoading: isWidgetUrlLoading,
  } = useFiatOnRampWidgetUrlQuery(
    // PERF: could consider skipping this call until eligibility in determined (ux tradeoffs)
    // as-is, avoids waterfalling requests => better ux
    {
      ownerAddress: activeAccountAddress,
      colorCode: colors.accent1.val,
      externalTransactionId,
      amount: baseCurrencyAmount,
      currencyCode: quoteCurrencyCode,
      baseCurrencyCode,
      redirectUrl: `${
        IS_ANDROID ? uniswapUrls.appUrl : uniswapUrls.appBaseUrl
      }/?screen=transaction&fiatOnRamp=true&userAddress=${activeAccountAddress}`,
    }
  )
  const {
    data: buyQuote,
    isFetching: buyQuoteLoading,
    isError: buyQuoteLoadingQueryError,
  } = useFiatOnRampBuyQuoteQuery(
    {
      baseCurrencyCode,
      baseCurrencyAmount: debouncedBaseCurrencyAmount,
      quoteCurrencyCode,
      areFeesIncluded: MOONPAY_FEES_INCLUDED,
    },
    {
      // When isBaseCurrencyAmountValid is false and the user enters any digit,
      // isBaseCurrencyAmountValid becomes true. Since there were no prior calls to the API,
      // it takes the debouncedBaseCurrencyAmount and immediately calls an API.
      // This only truly matters in the beginning and in cases where the debouncedBaseCurrencyAmount
      // is changed while isBaseCurrencyAmountValid is false."
      skip: !isBaseCurrencyAmountValid || debouncedBaseCurrencyAmount !== baseCurrencyAmount,
    }
  )

  const quoteAmount = buyQuote?.quoteCurrencyAmount ?? 0

  const {
    data: ipAddressData,
    isLoading: isEligibleLoading,
    isError: isFiatBuyAllowedQueryError,
  } = useFiatOnRampIpAddressQuery()

  const eligible = Boolean(ipAddressData?.isBuyAllowed)

  const isLoading = isEligibleLoading || isWidgetUrlLoading
  const isError =
    isFiatBuyAllowedQueryError ||
    isWidgetUrlQueryError ||
    buyQuoteLoadingQueryError ||
    limitsLoadingQueryError

  const quoteCurrencyAmountLoading =
    buyQuoteLoading || limitsLoading || debouncedBaseCurrencyAmount !== baseCurrencyAmount

  const quoteCurrencyAmountReady = isBaseCurrencyAmountValid && !quoteCurrencyAmountLoading

  const { addFiatSymbolToNumber } = useLocalizationContext()
  const minBuyAmountWithFiatSymbol = addFiatSymbolToNumber({
    value: minBuyAmount,
    currencyCode: baseCurrencyCode,
    currencySymbol: baseCurrencySymbol,
  })
  const maxBuyAmountWithFiatSymbol = addFiatSymbolToNumber({
    value: maxBuyAmount,
    currencyCode: baseCurrencyCode,
    currencySymbol: baseCurrencySymbol,
  })

  let errorText, errorColor: ColorTokens | undefined
  if (isError) {
    errorText = t('Something went wrong.')
    errorColor = '$DEP_accentWarning'
  } else if (amountIsTooSmall) {
    errorText = t('{{amount}} minimum', { amount: minBuyAmountWithFiatSymbol })
    errorColor = '$statusCritical'
  } else if (amountIsTooLarge) {
    errorText = t('{{amount}} maximum', { amount: maxBuyAmountWithFiatSymbol })
    errorColor = '$statusCritical'
  }

  return {
    eligible,
    quoteAmount,
    quoteCurrencyAmountReady,
    quoteCurrencyAmountLoading,
    isLoading,
    externalTransactionId,
    dispatchAddTransaction,
    fiatOnRampHostUrl,
    isError,
    errorText,
    errorColor,
  }
}

// Wrapper hook for useFiatOnRampSupportedTokensQuery with filtering by country and/or state in US
export function useFiatOnRampSupportedTokens(): {
  data: MoonpayCurrency[] | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
} {
  // this should be already cached by the time we need it
  const {
    data: ipAddressData,
    isLoading: isEligibleLoading,
    isError: isFiatBuyAllowedQueryError,
    refetch: isFiatBuyAllowedQueryRefetch,
  } = useFiatOnRampIpAddressQuery()

  const {
    data: supportedTokens,
    isLoading: supportedTokensLoading,
    isError: supportedTokensQueryError,
    refetch: supportedTokensQueryRefetch,
  } = useFiatOnRampSupportedTokensQuery(
    {
      isUserInUS: ipAddressData?.alpha3 === 'USA' ?? false,
      stateInUS: ipAddressData?.state,
    },
    { skip: !ipAddressData }
  )

  return {
    data: supportedTokens,
    isLoading: isEligibleLoading || supportedTokensLoading,
    isError: isFiatBuyAllowedQueryError || supportedTokensQueryError,
    refetch: async (): Promise<void> => {
      await isFiatBuyAllowedQueryRefetch()
      await supportedTokensQueryRefetch()
    },
  }
}
