import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { Delay } from 'src/components/layout/Delayed'

import { ColorTokens } from 'ui/src'
import { useDebounce } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import {
  useFiatOnRampBuyQuoteQuery,
  useFiatOnRampIpAddressQuery,
  useFiatOnRampLimitsQuery,
  useFiatOnRampSupportedTokensQuery,
  useFiatOnRampWidgetUrlQuery,
} from 'wallet/src/features/fiatOnRamp/api'
import { MoonpayCurrency } from 'wallet/src/features/fiatOnRamp/types'
import { addTransaction } from 'wallet/src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

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

// TODO: remove this when we support other fiat currencies for purchasing on moonpay
const MOONPAY_BASE_CURRENCY_CODE = 'usd'
const MOONPAY_FEES_INCLUDED = true

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
  const theme = useAppTheme()
  const { t } = useTranslation()

  const debouncedBaseCurrencyAmount = useDebounce(baseCurrencyAmount, Delay.Short)

  // we can consider adding `ownerAddress` as a prop to this modal in the future
  // for now, always assume the user wants to fund the current account
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const { externalTransactionId, dispatchAddTransaction } =
    useFiatOnRampTransactionCreator(activeAccountAddress)

  const {
    data: limitsData,
    isLoading: limitsLoading,
    isError: limitsLoadingQueryError,
  } = useFiatOnRampLimitsQuery({
    baseCurrencyCode: MOONPAY_BASE_CURRENCY_CODE,
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
  const isBaseCurrencyAmountValid = !!baseCurrencyAmount && !amountIsTooSmall && !amountIsTooLarge

  const {
    data: fiatOnRampHostUrl,
    isError: isWidgetUrlQueryError,
    isLoading: isWidgetUrlLoading,
  } = useFiatOnRampWidgetUrlQuery(
    // PERF: could consider skipping this call until eligibility in determined (ux tradeoffs)
    // as-is, avoids waterfalling requests => better ux
    {
      ownerAddress: activeAccountAddress,
      colorCode: theme.colors.accent1,
      externalTransactionId,
      amount: baseCurrencyAmount,
      currencyCode: quoteCurrencyCode,
    }
  )
  const {
    data: buyQuote,
    isFetching: buyQuoteLoading,
    isError: buyQuoteLoadingQueryError,
  } = useFiatOnRampBuyQuoteQuery(
    {
      baseCurrencyCode: MOONPAY_BASE_CURRENCY_CODE,
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

  let errorText, errorColor: ColorTokens | undefined
  if (isError) {
    errorText = t('Something went wrong.')
    errorColor = '$DEP_accentWarning'
  } else if (amountIsTooSmall) {
    errorText = t('${{amount}} minimum', { amount: minBuyAmount })
    errorColor = '$statusCritical'
  } else if (amountIsTooLarge) {
    errorText = t('${{amount}} maximum', { amount: maxBuyAmount })
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
