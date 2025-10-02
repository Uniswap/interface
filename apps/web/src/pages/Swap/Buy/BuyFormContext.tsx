import { skipToken } from '@reduxjs/toolkit/query/react'
import { useUSDTokenUpdater } from 'hooks/useUSDTokenUpdater'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import { useFiatOnRampSupportedTokens, useMeldFiatCurrencyInfo } from 'pages/Swap/Buy/hooks'
import { formatFORErrorAmount, getOnRampInputAmount, parseAndFormatFiatOnRampFiatAmount } from 'pages/Swap/Buy/shared'
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buildPartialCurrencyInfo } from 'uniswap/src/constants/routing'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  useFiatOnRampAggregatorCountryListQuery,
  useFiatOnRampAggregatorCryptoQuoteQuery,
} from 'uniswap/src/features/fiatOnRamp/api'
import {
  FiatCurrencyInfo,
  FiatOnRampCurrency,
  FORCountry,
  FORFilters,
  FORQuoteResponse,
  FORSupportedCountriesResponse,
  RampDirection,
} from 'uniswap/src/features/fiatOnRamp/types'
import {
  InvalidRequestAmountTooHigh,
  InvalidRequestAmountTooLow,
  isBadRequestAmountTooHigh,
  isBadRequestAmountTooLow,
  isFiatOnRampApiError,
  isInvalidRequestAmountTooHigh,
  isInvalidRequestAmountTooLow,
} from 'uniswap/src/features/fiatOnRamp/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { useDebounce } from 'utilities/src/time/timing'

class BuyFormError extends Error {
  constructor(public readonly message: string) {
    super(message)
  }
}

type BuyFormState = {
  readonly inputAmount: string
  readonly inputInFiat: boolean
  readonly quoteCurrency: Maybe<FiatOnRampCurrency>
  readonly selectedCountry?: FORCountry
  readonly countryModalOpen: boolean
  readonly currencyModalOpen: boolean
  readonly providerModalOpen: boolean
  readonly rampDirection: RampDirection
  readonly selectedUnsupportedCurrency?: FiatOnRampCurrency
  readonly moonpayOnly?: boolean
  readonly paymentMethod?: FORFilters
}

type BuyInfo = {
  readonly meldSupportedFiatCurrency?: FiatCurrencyInfo
  readonly notAvailableInThisRegion: boolean
  readonly countryOptionsResult?: FORSupportedCountriesResponse
  readonly supportedTokens?: FiatOnRampCurrency[]
  readonly amountOut?: string
  readonly amountOutLoading?: boolean
  readonly quotes?: FORQuoteResponse
  readonly fetchingQuotes: boolean
  readonly error?: BuyFormError
}

type BuyFormContextType = {
  buyFormState: BuyFormState
  setBuyFormState: Dispatch<SetStateAction<BuyFormState>>
  derivedBuyFormInfo: BuyInfo
}

export const ethCurrencyInfo = buildPartialCurrencyInfo(nativeOnChain(UniverseChainId.Mainnet))
const DEFAULT_BUY_FORM_STATE: BuyFormState = {
  inputAmount: '',
  inputInFiat: true,
  quoteCurrency: undefined,
  selectedCountry: undefined,
  countryModalOpen: false,
  currencyModalOpen: false,
  providerModalOpen: false,
  rampDirection: RampDirection.ONRAMP,
  selectedUnsupportedCurrency: undefined,
  moonpayOnly: false,
  paymentMethod: undefined,
}

export const BuyFormContext = createContext<BuyFormContextType>({
  buyFormState: DEFAULT_BUY_FORM_STATE,
  setBuyFormState: () => undefined,
  derivedBuyFormInfo: {
    meldSupportedFiatCurrency: undefined,
    notAvailableInThisRegion: false,
    countryOptionsResult: undefined,
    supportedTokens: [],
    amountOut: undefined,
    amountOutLoading: false,
    quotes: undefined,
    fetchingQuotes: false,
    error: undefined,
  },
})

export function useBuyFormContext() {
  return useContext(BuyFormContext)
}

function useDerivedBuyFormInfo(state: BuyFormState): BuyInfo {
  const { t } = useTranslation()
  const inputAmount = useDebounce(state.inputAmount)
  const { formattedAmount: amountOut, loading: amountOutLoading } = useUSDTokenUpdater({
    isFiatInput: state.inputInFiat,
    exactAmount: inputAmount,
    exactCurrency: state.quoteCurrency?.currencyInfo?.currency,
  })

  const accountAddress = useActiveAddress(
    state.quoteCurrency?.currencyInfo?.currency.chainId ?? UniverseChainId.Mainnet,
  )
  const balance = useCurrencyBalance(accountAddress, state.quoteCurrency?.currencyInfo?.currency)

  const { meldSupportedFiatCurrency, notAvailableInThisRegion } = useMeldFiatCurrencyInfo(state.selectedCountry)

  const { data: countryOptionsResult } = useFiatOnRampAggregatorCountryListQuery({
    rampDirection: state.rampDirection,
  })
  const supportedTokens = useFiatOnRampSupportedTokens(meldSupportedFiatCurrency, state.selectedCountry?.countryCode)
  const onRampInputAmount = useMemo(
    () =>
      getOnRampInputAmount({
        rampDirection: state.rampDirection,
        inputAmount,
        amountOut: amountOut ?? '0',
        inputInFiat: state.inputInFiat,
      }),
    [state.rampDirection, inputAmount, amountOut, state.inputInFiat],
  )

  const [sourceCurrencyCode, destinationCurrencyCode] = useMemo(() => {
    return state.rampDirection === RampDirection.ONRAMP
      ? [meldSupportedFiatCurrency.code, state.quoteCurrency?.meldCurrencyCode]
      : [state.quoteCurrency?.meldCurrencyCode, meldSupportedFiatCurrency.code]
  }, [meldSupportedFiatCurrency, state.quoteCurrency, state.rampDirection])

  const {
    data: quotes,
    isFetching: fetchingQuotes,
    error: quotesError,
  } = useFiatOnRampAggregatorCryptoQuoteQuery(
    inputAmount &&
      inputAmount !== '' &&
      amountOut &&
      amountOut !== '' &&
      accountAddress &&
      state.selectedCountry?.countryCode &&
      sourceCurrencyCode &&
      destinationCurrencyCode
      ? {
          sourceAmount: parseFloat(onRampInputAmount),
          sourceCurrencyCode,
          destinationCurrencyCode,
          countryCode: state.selectedCountry.countryCode,
          walletAddress: accountAddress,
          state: state.selectedCountry.state,
          rampDirection: state.rampDirection,
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: true,
    },
  )

  const { formatNumberOrString } = useLocalizationContext()

  const error = useMemo(() => {
    if (
      state.rampDirection === RampDirection.OFFRAMP &&
      onRampInputAmount &&
      balance &&
      Number(onRampInputAmount) > Number(balance.toExact())
    ) {
      return new BuyFormError(t('fiatOffRamp.error.balance'))
    }

    if (quotesError && isFiatOnRampApiError(quotesError)) {
      if (isInvalidRequestAmountTooLow(quotesError)) {
        const error = quotesError as InvalidRequestAmountTooLow
        const isFiat = error.data.context.unit === 'fiat'
        const quoteCurrency = state.quoteCurrency?.currencyInfo?.currency
        const formattedAmount = formatFORErrorAmount({
          amount: error.data.context.minimumAllowed,
          isFiat,
          fiatCurrencyInfo: meldSupportedFiatCurrency,
          quoteCurrency,
          formatNumberOrString,
          getSymbolDisplayText,
        })

        if (!formattedAmount) {
          return new BuyFormError(t('common.card.error.description'))
        }

        return new BuyFormError(t(`fiatOnRamp.error.min`, { amount: formattedAmount }))
      }

      if (isInvalidRequestAmountTooHigh(quotesError)) {
        const error = quotesError as InvalidRequestAmountTooHigh
        const quoteCurrency = state.quoteCurrency?.currencyInfo?.currency
        const isFiat = error.data.context.unit === 'fiat'
        const formattedAmount = formatFORErrorAmount({
          amount: error.data.context.maximumAllowed,
          isFiat,
          fiatCurrencyInfo: meldSupportedFiatCurrency,
          quoteCurrency,
          formatNumberOrString,
          getSymbolDisplayText,
        })

        if (!formattedAmount) {
          return new BuyFormError(t('common.card.error.description'))
        }

        return new BuyFormError(t(`fiatOnRamp.error.max`, { amount: formattedAmount }))
      }
      if (isBadRequestAmountTooLow(quotesError)) {
        const formattedAmount = parseAndFormatFiatOnRampFiatAmount(quotesError.data.context, meldSupportedFiatCurrency)
        if (!formattedAmount) {
          return new BuyFormError(t('common.card.error.description'))
        }
        return new BuyFormError(t('fiatOnRamp.error.min', { amount: formattedAmount }))
      }
      if (isBadRequestAmountTooHigh(quotesError)) {
        const formattedAmount = parseAndFormatFiatOnRampFiatAmount(quotesError.data.context, meldSupportedFiatCurrency)
        if (!formattedAmount) {
          return new BuyFormError(t('common.card.error.description'))
        }
        return new BuyFormError(t('fiatOnRamp.error.max', { amount: formattedAmount }))
      }
      return new BuyFormError(t('common.card.error.description'))
    }
    if (inputAmount && quotes?.quotes && quotes.quotes.length === 0) {
      return new BuyFormError(t('fiatOnRamp.noQuotes.error'))
    }
    return undefined
  }, [
    balance,
    formatNumberOrString,
    inputAmount,
    meldSupportedFiatCurrency,
    onRampInputAmount,
    quotes?.quotes,
    quotesError,
    state.quoteCurrency?.currencyInfo?.currency,
    state.rampDirection,
    t,
  ])

  return useMemo(
    () => ({
      amountOut,
      amountOutLoading,
      notAvailableInThisRegion,
      meldSupportedFiatCurrency,
      supportedTokens,
      countryOptionsResult,
      quotes,
      fetchingQuotes,
      error,
    }),
    [
      amountOut,
      amountOutLoading,
      countryOptionsResult,
      error,
      fetchingQuotes,
      meldSupportedFiatCurrency,
      notAvailableInThisRegion,
      quotes,
      supportedTokens,
    ],
  )
}

export function BuyFormContextProvider({
  children,
  rampDirection,
}: PropsWithChildren<{ rampDirection: RampDirection }>) {
  const [buyFormState, setBuyFormState] = useState<BuyFormState>({ ...DEFAULT_BUY_FORM_STATE, rampDirection })
  const derivedBuyFormInfo = useDerivedBuyFormInfo(buyFormState)

  const value = useMemo(
    () => ({
      buyFormState,
      setBuyFormState,
      derivedBuyFormInfo,
    }),
    [buyFormState, derivedBuyFormInfo],
  )

  return <BuyFormContext.Provider value={value}>{children}</BuyFormContext.Provider>
}
