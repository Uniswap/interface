import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { Delay } from 'src/components/layout/Delayed'

import {
  useFiatOnRampBuyQuoteQuery,
  useFiatOnRampLimitsQuery,
  useFiatOnRampWidgetUrlQuery,
  useIsFiatOnRampBuyAllowedQuery,
} from 'src/features/fiatOnRamp/api'
import { addTransaction } from 'src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { createTransactionId } from 'src/features/transactions/utils'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { useDebounce } from 'src/utils/timing'
import { ChainId } from 'wallet/src/constants/chains'

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
  eligible?: boolean
  quoteAmount: number
  quoteCurrencyAmountReady: boolean
  isLoading: boolean
  externalTransactionId: string
  dispatchAddTransaction: () => void
  fiatOnRampHostUrl?: string
  isError: boolean
  errorText?: string
  errorColor?: keyof Theme['colors']
} {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const debouncedBaseCurrencyAmount = useDebounce(baseCurrencyAmount, Delay.Long)

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

  const { minBuyAmount, maxBuyAmount } = limitsData?.baseCurrency ?? {
    minBuyAmount: 0,
    maxBuyAmount: Infinity,
  }

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
      colorCode: theme.colors.accentAction,
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
    data: eligible,
    isLoading: isEligibleLoading,
    isError: isFiatBuyAllowedQueryError,
  } = useIsFiatOnRampBuyAllowedQuery()

  const isLoading = isEligibleLoading || isWidgetUrlLoading
  const isError =
    isFiatBuyAllowedQueryError ||
    isWidgetUrlQueryError ||
    buyQuoteLoadingQueryError ||
    limitsLoadingQueryError

  const quoteCurrencyAmountReady =
    isBaseCurrencyAmountValid &&
    !buyQuoteLoading &&
    !limitsLoading &&
    debouncedBaseCurrencyAmount === baseCurrencyAmount

  let errorText, errorColor: keyof Theme['colors'] | undefined
  if (isError) {
    errorText = t('Something went wrong.')
    errorColor = 'accentWarning'
  } else if (amountIsTooSmall) {
    errorText = t('${{amount}} minimum', { amount: minBuyAmount })
    errorColor = 'accentCritical'
  } else if (amountIsTooLarge) {
    errorText = t('${{amount}} maximum', { amount: maxBuyAmount })
    errorColor = 'accentCritical'
  }

  return {
    eligible,
    quoteAmount,
    quoteCurrencyAmountReady,
    isLoading,
    externalTransactionId,
    dispatchAddTransaction,
    fiatOnRampHostUrl,
    isError,
    errorText,
    errorColor,
  }
}
