import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError, skipToken } from '@reduxjs/toolkit/query/react'
import { Currency } from '@uniswap/sdk-core'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Delay } from 'src/components/layout/Delayed'
import { ColorTokens } from 'ui/src'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  useFiatOnRampAggregatorCryptoQuoteQuery,
  useFiatOnRampAggregatorSupportedFiatCurrenciesQuery,
  useFiatOnRampAggregatorSupportedTokensQuery,
} from 'uniswap/src/features/fiatOnRamp/api'
import {
  FORQuote,
  FORSupportedFiatCurrency,
  FORSupportedToken,
  FiatCurrencyInfo,
  FiatOnRampCurrency,
} from 'uniswap/src/features/fiatOnRamp/types'
import {
  createOnRampTransactionId,
  isFiatOnRampApiError,
  isInvalidRequestAmountTooHigh,
  isInvalidRequestAmountTooLow,
} from 'uniswap/src/features/fiatOnRamp/utils'
import { WalletChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useDebounce } from 'utilities/src/time/timing'
import { useCurrencies } from 'wallet/src/components/TokenSelector/hooks'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import { useAppFiatCurrencyInfo, useFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { addTransaction } from 'wallet/src/features/transactions/slice'
import {
  FiatPurchaseTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'
import { getFormattedCurrencyAmount } from 'wallet/src/utils/currency'
import { ValueType } from 'wallet/src/utils/getCurrencyAmount'

export function useFormatExactCurrencyAmount(currencyAmount: string, currency: Maybe<Currency>): string | undefined {
  const formatter = useLocalizationContext()

  if (!currencyAmount || !currency) {
    return
  }

  const formattedAmount = getFormattedCurrencyAmount(currency, currencyAmount, formatter, true, ValueType.Exact)

  // when formattedAmount is not empty it has an empty space in the end
  return formattedAmount === '' ? '0 ' : formattedAmount
}

/** Returns a new externalTransactionId and a callback to store the transaction. */
export function useFiatOnRampTransactionCreator(
  ownerAddress: string,
  chainId: WalletChainId,
  serviceProvider?: string,
  initialTypeInfo?: Partial<FiatPurchaseTransactionInfo>,
): {
  externalTransactionId: string
  dispatchAddTransaction: () => void
} {
  const dispatch = useDispatch()

  const externalTransactionId = useRef(createOnRampTransactionId(serviceProvider))

  const dispatchAddTransaction = useCallback(() => {
    // adds a dummy transaction detail for now
    // later, we will attempt to look up information for that id
    const transactionDetail: TransactionDetails = {
      routing: Routing.CLASSIC,
      chainId,
      id: externalTransactionId.current,
      from: ownerAddress,
      typeInfo: {
        ...initialTypeInfo,
        type: TransactionType.FiatPurchase,
        syncedWithBackend: false,
      },
      status: TransactionStatus.Pending,
      addedTime: Date.now(),
      hash: '',
      options: { request: {} },
    }
    // use addTransaction action so transactionWatcher picks it up
    dispatch(addTransaction(transactionDetail))
  }, [initialTypeInfo, chainId, ownerAddress, dispatch])

  return { externalTransactionId: externalTransactionId.current, dispatchAddTransaction }
}

export function useMeldFiatCurrencySupportInfo(countryCode: string): {
  appFiatCurrencySupportedInMeld: boolean
  meldSupportedFiatCurrency: FiatCurrencyInfo
  supportedFiatCurrencies: FORSupportedFiatCurrency[] | undefined
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
      (currency): boolean => appFiatCurrencyCode === currency.fiatCurrencyCode.toLowerCase(),
    )
  const meldSupportedFiatCurrency = appFiatCurrencySupported ? appFiatCurrencyInfo : fallbackCurrencyInfo

  return {
    appFiatCurrencySupportedInMeld: appFiatCurrencySupported,
    meldSupportedFiatCurrency,
    supportedFiatCurrencies: supportedFiatCurrencies?.fiatCurrencies,
  }
}

function findTokenOptionForFiatOnRampToken(
  currencies: CurrencyInfo[] | undefined = [],
  fiatOnRampToken: FORSupportedToken,
): Maybe<CurrencyInfo> {
  return currencies.find((item) => {
    const symbol = fiatOnRampToken.cryptoCurrencyCode.split('_')?.[0]?.toLowerCase()
    return (
      item &&
      symbol &&
      symbol === item.currency.symbol?.toLowerCase() &&
      fiatOnRampToken.chainId === item.currency.chainId.toString()
    )
  })
}

function buildCurrencyIdForFORSupportedToken(supportedToken: FORSupportedToken): string | undefined {
  const chainId = toSupportedChainId(supportedToken.chainId)
  return chainId
    ? supportedToken.address
      ? buildCurrencyId(chainId, supportedToken.address)
      : buildNativeCurrencyId(chainId)
    : undefined
}

export function useFiatOnRampSupportedTokens({
  sourceCurrencyCode,
  countryCode,
}: {
  sourceCurrencyCode: string
  countryCode: string
}): {
  error: boolean
  list: FiatOnRampCurrency[] | undefined
  loading: boolean
  refetch: () => void
} {
  const {
    data: supportedTokensResponse,
    isLoading: supportedTokensLoading,
    error: supportedTokensError,
    refetch: refetchSupportedTokens,
  } = useFiatOnRampAggregatorSupportedTokensQuery({ fiatCurrency: sourceCurrencyCode, countryCode })

  const currencyIds: string[] = useMemo(
    () =>
      supportedTokensResponse?.supportedTokens
        .map(buildCurrencyIdForFORSupportedToken)
        .filter((st): st is string => !!st) ?? [],
    [supportedTokensResponse],
  )

  const {
    data: currencies,
    error: currenciesError,
    loading: currenciesLoading,
    refetch: refetchCurrencies,
  } = useCurrencies(currencyIds)

  const list = useMemo(
    () =>
      (supportedTokensResponse?.supportedTokens || [])
        .map((fiatOnRampToken) => ({
          currencyInfo: findTokenOptionForFiatOnRampToken(currencies, fiatOnRampToken),
          meldCurrencyCode: fiatOnRampToken.cryptoCurrencyCode,
        }))
        .filter((item) => !!item.currencyInfo),
    [currencies, supportedTokensResponse?.supportedTokens],
  )

  const loading = supportedTokensLoading || currenciesLoading
  const error = Boolean(supportedTokensError || currenciesError)
  const refetch = async (): Promise<void> => {
    if (supportedTokensError) {
      await refetchSupportedTokens?.()
    }
    if (currenciesError) {
      refetchCurrencies?.()
    }
  }

  return { list, loading, error, refetch }
}

/**
 * Hook to load quotes
 */
export function useFiatOnRampQuotes({
  baseCurrencyAmount,
  baseCurrencyCode,
  quoteCurrencyCode,
  countryCode,
  countryState,
}: {
  baseCurrencyAmount?: number
  baseCurrencyCode: string | undefined
  quoteCurrencyCode: string | undefined
  countryCode: string | undefined
  countryState: string | undefined
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
          walletAddress: walletAddress ?? undefined,
          state: countryState,
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: true,
    },
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
  currencyCode: string,
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
