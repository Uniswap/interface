import { skipToken } from '@reduxjs/toolkit/query/react'
import { Currency } from '@uniswap/sdk-core'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Delay } from 'src/components/layout/Delayed'
import { ColorTokens, useSporeColors } from 'ui/src'
import { useDebounce } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import { uniswapUrls } from 'wallet/src/constants/urls'
import {
  useFiatOnRampBuyQuoteQuery,
  useFiatOnRampIpAddressQuery,
  useFiatOnRampLimitsQuery,
  useFiatOnRampSupportedTokensQuery,
  useFiatOnRampWidgetUrlQuery,
} from 'wallet/src/features/fiatOnRamp/api'
import { useMoonpayFiatCurrencySupportInfo } from 'wallet/src/features/fiatOnRamp/hooks'
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
import { isAndroid } from 'wallet/src/utils/platform'

export function useFormatExactCurrencyAmount(
  currencyAmount: string,
  currency: Maybe<Currency>
): string | undefined {
  const formatter = useLocalizationContext()

  if (!currencyAmount || !currency) {
    return
  }

  const formattedAmount = getFormattedCurrencyAmount(
    currency,
    currencyAmount,
    formatter,
    true,
    ValueType.Exact
  )

  // when formattedAmount is not empty it has an empty space in the end
  return formattedAmount === '' ? '0 ' : formattedAmount
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

/**
 * Hook to provide data from Moonpay for Fiat On Ramp Input Amount screen.
 */
export function useMoonpayFiatOnRamp({
  baseCurrencyAmount,
  quoteCurrencyCode,
}: {
  baseCurrencyAmount: string
  quoteCurrencyCode: string | undefined
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
  } = useFiatOnRampLimitsQuery(
    quoteCurrencyCode
      ? {
          baseCurrencyCode,
          quoteCurrencyCode,
          areFeesIncluded: MOONPAY_FEES_INCLUDED,
        }
      : skipToken
  )

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
    quoteCurrencyCode
      ? {
          ownerAddress: activeAccountAddress,
          colorCode: colors.accent1.val,
          externalTransactionId,
          amount: baseCurrencyAmount,
          currencyCode: quoteCurrencyCode,
          baseCurrencyCode,
          redirectUrl: `${
            isAndroid ? uniswapUrls.appUrl : uniswapUrls.appBaseUrl
          }/?screen=transaction&fiatOnRamp=true&userAddress=${activeAccountAddress}`,
        }
      : skipToken
  )
  const {
    data: buyQuote,
    isFetching: buyQuoteLoading,
    isError: buyQuoteLoadingQueryError,
  } = useFiatOnRampBuyQuoteQuery(
    // When isBaseCurrencyAmountValid is false and the user enters any digit,
    // isBaseCurrencyAmountValid becomes true. Since there were no prior calls to the API,
    // it takes the debouncedBaseCurrencyAmount and immediately calls an API.
    // This only truly matters in the beginning and in cases where the debouncedBaseCurrencyAmount
    // is changed while isBaseCurrencyAmountValid is false."
    quoteCurrencyCode &&
      isBaseCurrencyAmountValid &&
      debouncedBaseCurrencyAmount === baseCurrencyAmount
      ? {
          baseCurrencyCode,
          baseCurrencyAmount: debouncedBaseCurrencyAmount,
          quoteCurrencyCode,
          areFeesIncluded: MOONPAY_FEES_INCLUDED,
        }
      : skipToken
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

  const { errorText, errorColor } = useMoonpayError(
    isError,
    amountIsTooSmall,
    amountIsTooLarge,
    minBuyAmountWithFiatSymbol,
    maxBuyAmountWithFiatSymbol
  )

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

function useMoonpayError(
  hasError: boolean,
  amountIsTooSmall: boolean,
  amountIsTooLarge: boolean,
  minBuyAmountWithFiatSymbol: string,
  maxBuyAmountWithFiatSymbol: string
): {
  errorText: string | undefined
  errorColor: ColorTokens | undefined
} {
  const { t } = useTranslation()

  let errorText, errorColor: ColorTokens | undefined

  if (hasError) {
    errorText = t('Something went wrong.')
    errorColor = '$DEP_accentWarning'
  } else if (amountIsTooSmall) {
    errorText = t('Minimum {{amount}}', { amount: minBuyAmountWithFiatSymbol })
    errorColor = '$statusCritical'
  } else if (amountIsTooLarge) {
    errorText = t('Maximum {{amount}}', { amount: maxBuyAmountWithFiatSymbol })
    errorColor = '$statusCritical'
  }

  return { errorText, errorColor }
}
