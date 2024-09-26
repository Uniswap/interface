import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError, skipToken } from '@reduxjs/toolkit/query/react'
import { Currency } from '@uniswap/sdk-core'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getCountry } from 'react-native-localize'
import { useDispatch } from 'react-redux'
import { useCurrencies } from 'uniswap/src/components/TokenSelector/hooks'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrencyInfo, useFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import {
  useFiatOnRampAggregatorCryptoQuoteQuery,
  useFiatOnRampAggregatorGetCountryQuery,
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
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WalletChainId } from 'uniswap/src/types/chains'
import { getFormattedCurrencyAmount } from 'uniswap/src/utils/currency'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useDebounce } from 'utilities/src/time/timing'

const SHORT_DELAY = 500

export function useFormatExactCurrencyAmount(currencyAmount: string, currency: Maybe<Currency>): string | undefined {
  const formatter = useLocalizationContext()

  if (!currencyAmount || !currency) {
    return
  }

  const formattedAmount = getFormattedCurrencyAmount(currency, currencyAmount, formatter, false, ValueType.Exact)

  // when formattedAmount is not empty it has an empty space in the end
  return formattedAmount === '' ? '0 ' : formattedAmount
}

/** Returns a new externalTransactionId and a callback to store the transaction. */
export function useFiatOnRampTransactionCreator(
  ownerAddress: string,
  chainId: WalletChainId,
  serviceProvider?: string,
): {
  externalTransactionId: string
  dispatchAddTransaction: () => void
} {
  const dispatch = useDispatch()

  const externalTransactionId = useRef(createOnRampTransactionId(serviceProvider))

  const dispatchAddTransaction = useCallback(() => {
    // Adds a LocalOnRampTransaction to track the transaction
    // Later we will query the transaction details for that id
    const transactionDetail: TransactionDetails = {
      routing: Routing.CLASSIC,
      chainId,
      id: externalTransactionId.current,
      from: ownerAddress,
      typeInfo: {
        type: TransactionType.LocalOnRamp,
      },
      status: TransactionStatus.Pending,
      addedTime: Date.now(),
      hash: '',
      options: { request: {} },
      transactionOriginType: TransactionOriginType.Internal,
    }
    // use addTransaction action so transactionWatcher picks it up
    dispatch(addTransaction(transactionDetail))
  }, [chainId, ownerAddress, dispatch])

  return { externalTransactionId: externalTransactionId.current, dispatchAddTransaction }
}

export function useMeldFiatCurrencySupportInfo(
  countryCode: string,
  skip: boolean = false,
): {
  appFiatCurrencySupportedInMeld: boolean
  meldSupportedFiatCurrency: FiatCurrencyInfo
  supportedFiatCurrencies: FORSupportedFiatCurrency[] | undefined
} {
  // Not all the currencies are supported by Meld, so we need to fallback to USD if the currency is not supported
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const fallbackCurrencyInfo = useFiatCurrencyInfo(FiatCurrency.UnitedStatesDollar)
  const appFiatCurrencyCode = appFiatCurrencyInfo.code.toLowerCase()

  const { data: supportedFiatCurrencies } = useFiatOnRampAggregatorSupportedFiatCurrenciesQuery(
    { countryCode },
    { skip },
  )

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
  skip = false,
}: {
  sourceCurrencyCode: string
  countryCode: string
  skip?: boolean
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
  } = useFiatOnRampAggregatorSupportedTokensQuery({ fiatCurrency: sourceCurrencyCode, countryCode }, { skip })

  const supportedTokensById: Record<string, FORSupportedToken> = useMemo(
    () =>
      supportedTokensResponse?.supportedTokens.reduce<Record<string, FORSupportedToken>>((acc, token) => {
        const currencyId = buildCurrencyIdForFORSupportedToken(token)
        if (currencyId) {
          acc[currencyId] = token
        }
        return acc
      }, {}) ?? {},
    [supportedTokensResponse],
  )

  const {
    data: currencies,
    error: currenciesError,
    loading: currenciesLoading,
    refetch: refetchCurrencies,
  } = useCurrencies(Object.keys(supportedTokensById))

  const list = useMemo(
    () =>
      Object.entries(supportedTokensById)
        .map(([currencyId, fiatOnRampToken]) => ({
          currencyInfo: currencies?.find((currency) => currency.currencyId.toLowerCase() === currencyId.toLowerCase()),
          meldCurrencyCode: fiatOnRampToken.cryptoCurrencyCode,
        }))
        .filter((item) => !!item.currencyInfo),
    [currencies, supportedTokensById],
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
  const debouncedBaseCurrencyAmount = useDebounce(baseCurrencyAmount, SHORT_DELAY)
  const walletAddress = useAccountMeta()?.address

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
} {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  let errorText
  if (!error) {
    return { errorText }
  }

  errorText = t('fiatOnRamp.error.default')

  if (isFiatOnRampApiError(error)) {
    if (isInvalidRequestAmountTooLow(error)) {
      const formattedAmount = formatNumberOrString({
        value: error.data.context.minimumAllowed,
        type: NumberType.FiatStandard,
        currencyCode,
      })
      errorText = t('fiatOnRamp.error.min', { amount: formattedAmount })
    } else if (isInvalidRequestAmountTooHigh(error)) {
      const formattedAmount = formatNumberOrString({
        value: error.data.context.maximumAllowed,
        type: NumberType.FiatStandard,
        currencyCode,
      })
      errorText = t('fiatOnRamp.error.max', { amount: formattedAmount })
    }
  }

  return { errorText }
}

export function useIsSupportedFiatOnRampCurrency(
  currencyId: string,
  skip: boolean = false,
): FiatOnRampCurrency | undefined {
  const fallbackCountryCode = getCountry()
  const { currentData: ipCountryData } = useFiatOnRampAggregatorGetCountryQuery(undefined, { skip })
  const { meldSupportedFiatCurrency } = useMeldFiatCurrencySupportInfo(
    ipCountryData?.countryCode ?? fallbackCountryCode,
    skip,
  )
  const {
    list: supportedTokensList,
    loading: supportedTokensLoading,
    error: supportedTokensError,
  } = useFiatOnRampSupportedTokens({
    sourceCurrencyCode: meldSupportedFiatCurrency.code,
    countryCode: ipCountryData?.countryCode ?? fallbackCountryCode,
    skip,
  })

  if (supportedTokensLoading || supportedTokensError) {
    return undefined
  }

  const foundToken = supportedTokensList?.find((token) => token.currencyInfo?.currencyId === currencyId)

  return foundToken
}
