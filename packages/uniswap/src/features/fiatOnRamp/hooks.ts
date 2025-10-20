import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError, skipToken } from '@reduxjs/toolkit/query/react'
import { Currency } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCountry } from 'react-native-localize'
import { useDispatch } from 'react-redux'
import { useCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useCurrencies'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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
  FiatCurrencyInfo,
  FiatOnRampCurrency,
  FORQuote,
  FORSupportedFiatCurrency,
  FORSupportedToken,
  RampDirection,
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
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { getFormattedCurrencyAmount } from 'uniswap/src/utils/currency'
import { areCurrencyIdsEqual, buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useDebounce } from 'utilities/src/time/timing'

const SHORT_DELAY = 500

export function useFormatExactCurrencyAmount(currencyAmount: string, currency: Maybe<Currency>): string | undefined {
  const formatter = useLocalizationContext()

  if (!currencyAmount || !currency) {
    return undefined
  }

  const formattedAmount = getFormattedCurrencyAmount({
    currency,
    amount: currencyAmount,
    formatter,
    valueType: ValueType.Exact,
  })

  // when formattedAmount is not empty it has an empty space in the end
  return formattedAmount === '' ? '0 ' : formattedAmount
}

/** Returns a new externalTransactionId and a callback to store the transaction. */
export function useFiatOnRampTransactionCreator({
  ownerAddress,
  chainId,
  serviceProvider,
  idSuffix,
}: {
  ownerAddress: string
  chainId: UniverseChainId
  serviceProvider?: string
  idSuffix?: string
}): {
  externalTransactionId: string
  dispatchAddTransaction: ({ isOffRamp }: { isOffRamp: boolean }) => void
} {
  const dispatch = useDispatch()

  const externalTransactionId = useRef(createOnRampTransactionId(serviceProvider, idSuffix))

  const dispatchAddTransaction = useCallback(
    ({ isOffRamp }: { isOffRamp: boolean }) => {
      // Adds a local FOR transaction to track the transaction
      // Later we will query the transaction details for that id
      const transactionDetail: TransactionDetails = {
        routing: TradingApi.Routing.CLASSIC,
        chainId,
        id: externalTransactionId.current,
        from: ownerAddress,
        typeInfo: {
          type: isOffRamp ? TransactionType.LocalOffRamp : TransactionType.LocalOnRamp,
        },
        status: TransactionStatus.Pending,
        addedTime: Date.now(),
        hash: '',
        options: { request: {} },
        transactionOriginType: TransactionOriginType.Internal,
      }
      // use addTransaction action so transactionWatcher picks it up
      dispatch(addTransaction(transactionDetail))
    },
    [chainId, ownerAddress, dispatch],
  )

  return { externalTransactionId: externalTransactionId.current, dispatchAddTransaction }
}

export function useMeldFiatCurrencySupportInfo({
  countryCode,
  skip = false,
  rampDirection,
}: {
  countryCode: string
  skip?: boolean
  rampDirection?: RampDirection
}): {
  appFiatCurrencySupportedInMeld: boolean
  meldSupportedFiatCurrency: FiatCurrencyInfo
  supportedFiatCurrencies: FORSupportedFiatCurrency[] | undefined
} {
  // Not all the currencies are supported by Meld, so we need to fallback to USD if the currency is not supported
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const fallbackCurrencyInfo = useFiatCurrencyInfo(FiatCurrency.UnitedStatesDollar)
  const appFiatCurrencyCode = appFiatCurrencyInfo.code.toLowerCase()

  const { data: supportedFiatCurrencies } = useFiatOnRampAggregatorSupportedFiatCurrenciesQuery(
    { countryCode, rampDirection },
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
  rampDirection,
}: {
  sourceCurrencyCode: string
  countryCode: string
  skip?: boolean
  rampDirection?: RampDirection
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
  } = useFiatOnRampAggregatorSupportedTokensQuery(
    { fiatCurrency: sourceCurrencyCode, countryCode, rampDirection },
    { skip },
  )

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
          currencyInfo: currencies?.find((currency) => areCurrencyIdsEqual(currency.currencyId, currencyId)),
          meldCurrencyCode: fiatOnRampToken.cryptoCurrencyCode,
        }))
        .filter((item) => !!item.currencyInfo),
    [currencies, supportedTokensById],
  )

  const loading = supportedTokensLoading || currenciesLoading
  const error = Boolean(supportedTokensError || currenciesError)
  const refetch = async (): Promise<void> => {
    if (supportedTokensError) {
      await refetchSupportedTokens()
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
  rampDirection,
  balanceError,
}: {
  baseCurrencyAmount?: number
  baseCurrencyCode: string | undefined
  quoteCurrencyCode: string | undefined
  countryCode: string | undefined
  countryState: string | undefined
  rampDirection: RampDirection
  balanceError?: boolean
}): {
  loading: boolean
  error?: FetchBaseQueryError | SerializedError
  quotes: FORQuote[] | undefined
} {
  const debouncedBaseCurrencyAmount = useDebounce(baseCurrencyAmount, SHORT_DELAY)
  const walletAddress = useWallet().evmAccount?.address

  const {
    currentData: quotesResponse,
    isFetching: quotesFetching,
    error: quotesError,
  } = useFiatOnRampAggregatorCryptoQuoteQuery(
    baseCurrencyAmount && countryCode && quoteCurrencyCode && baseCurrencyCode && !balanceError
      ? {
          sourceAmount: baseCurrencyAmount,
          sourceCurrencyCode: rampDirection === RampDirection.OFFRAMP ? quoteCurrencyCode : baseCurrencyCode,
          destinationCurrencyCode: rampDirection === RampDirection.OFFRAMP ? baseCurrencyCode : quoteCurrencyCode,
          countryCode,
          walletAddress: walletAddress ?? undefined,
          state: countryState,
          rampDirection,
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

export function useParseFiatOnRampError({
  error,
  currencyCode,
  tokenCode,
  balanceError,
  noQuotesReturned,
}: {
  error: unknown
  currencyCode: string
  tokenCode?: string
  balanceError: boolean
  noQuotesReturned: boolean
}): {
  errorText: string | undefined
} {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  let errorText

  if (balanceError) {
    errorText = t('fiatOffRamp.error.balance')
  }
  if (noQuotesReturned) {
    errorText = t('fiatOnRamp.error.noQuotes')
  }

  if (!error) {
    return { errorText }
  }

  errorText = t('fiatOnRamp.error.default')

  if (isFiatOnRampApiError(error)) {
    const formatMinMaxError = (amount: number, unit?: string): string => {
      return (
        formatNumberOrString({
          value: amount,
          type: unit === 'token' ? NumberType.TokenTx : NumberType.FiatStandard,
          currencyCode,
        }) + (unit === 'token' ? ` ${tokenCode}` : '')
      )
    }

    if (isInvalidRequestAmountTooLow(error)) {
      const { minimumAllowed, unit } = error.data.context
      errorText = t('fiatOnRamp.error.min', { amount: formatMinMaxError(minimumAllowed, unit) })
    } else if (isInvalidRequestAmountTooHigh(error)) {
      const { maximumAllowed, unit } = error.data.context
      errorText = t('fiatOnRamp.error.max', { amount: formatMinMaxError(maximumAllowed, unit) })
    }
  }

  return { errorText }
}

export function useIsSupportedFiatOnRampCurrency(
  currencyId: string,
  skip: boolean = false,
): { currency: FiatOnRampCurrency | undefined; isLoading: boolean } {
  const fallbackCountryCode = getCountry()
  const { currentData: ipCountryData, isLoading: isCountryLoading } = useFiatOnRampAggregatorGetCountryQuery(
    undefined,
    { skip },
  )
  const { meldSupportedFiatCurrency } = useMeldFiatCurrencySupportInfo({
    countryCode: ipCountryData?.countryCode ?? fallbackCountryCode,
    skip,
  })
  const {
    list: supportedTokensList,
    loading: supportedTokensLoading,
    error: supportedTokensError,
  } = useFiatOnRampSupportedTokens({
    sourceCurrencyCode: meldSupportedFiatCurrency.code,
    countryCode: ipCountryData?.countryCode ?? fallbackCountryCode,
    skip,
  })

  const isLoading = isCountryLoading || supportedTokensLoading || supportedTokensError

  if (isLoading) {
    return { currency: undefined, isLoading }
  }
  const currency = supportedTokensList?.find(
    (token) => token.currencyInfo?.currencyId && areCurrencyIdsEqual(token.currencyInfo.currencyId, currencyId),
  )

  return { currency, isLoading }
}

/**
 * Determines loading state when fetching FOR quotes.
 * We debounce the amounts so theres some additional logic to consider
 * The useEffects help fix a race condition that otherwise results in some flickering
 */
export function useIsFORLoading({
  hasValidAmount,
  debouncedAmountsMatch,
  quotesLoading,
  exceedsBalanceError,
}: {
  hasValidAmount: boolean
  debouncedAmountsMatch: boolean
  quotesLoading: boolean
  exceedsBalanceError: boolean
}): boolean {
  const [isWaitingForNewQuotes, setIsWaitingForNewQuotes] = useState(false)

  useEffect(() => {
    // When amount changes, mark that we're waiting for new quotes
    if (!debouncedAmountsMatch) {
      setIsWaitingForNewQuotes(true)
    }
  }, [debouncedAmountsMatch])

  useEffect(() => {
    // When we get new quotes or an error, mark that we're no longer waiting
    if (!quotesLoading) {
      setIsWaitingForNewQuotes(false)
    }
  }, [quotesLoading])

  return hasValidAmount && isWaitingForNewQuotes && !exceedsBalanceError
}
