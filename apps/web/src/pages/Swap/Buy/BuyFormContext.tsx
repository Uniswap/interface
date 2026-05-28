import { skipToken } from '@reduxjs/toolkit/query/react'
import { useUSDTokenUpdater } from 'hooks/useUSDTokenUpdater'
import { useFiatOnRampSupportedTokens, useMeldFiatCurrencyInfo } from 'pages/Swap/Buy/hooks'
import { formatFORErrorAmount, getOnRampInputAmount, parseAndFormatFiatOnRampFiatAmount } from 'pages/Swap/Buy/shared'
import { Dispatch, PropsWithChildren, SetStateAction, createContext, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buildPartialCurrencyInfo } from 'uniswap/src/constants/routing'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  useFiatOnRampAggregatorCountryListQuery,
  useFiatOnRampAggregatorCryptoQuoteQuery,
} from 'uniswap/src/features/fiatOnRamp/api'
import {
  FORCountry,
  FORQuoteResponse,
  FORSupportedCountriesResponse,
  FiatCurrencyInfo,
  FiatOnRampCurrency,
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
import { useAccount } from 'wagmi'

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
  const account = useAccount()
  const { formattedAmount: amountOut, loading: amountOutLoading } = useUSDTokenUpdater(
    state.inputInFiat,
    state.inputAmount,
    state.quoteCurrency?.currencyInfo?.currency,
  )

  const { meldSupportedFiatCurrency, notAvailableInThisRegion } = useMeldFiatCurrencyInfo(state.selectedCountry)

  const { data: countryOptionsResult } = useFiatOnRampAggregatorCountryListQuery({
    rampDirection: state.rampDirection,
  })
  const supportedTokens = useFiatOnRampSupportedTokens(meldSupportedFiatCurrency, state.selectedCountry?.countryCode)
  const onRampInputAmount = useMemo(
    () => getOnRampInputAmount(state.rampDirection, state.inputAmount, amountOut ?? '0', state.inputInFiat),
    [state.rampDirection, state.inputAmount, amountOut, state.inputInFiat],
  )

  const {
    data: quotes,
    isFetching: fetchingQuotes,
    error: quotesError,
  } = useFiatOnRampAggregatorCryptoQuoteQuery(
    state.inputAmount &&
      state.inputAmount !== '' &&
      amountOut &&
      amountOut !== '' &&
      account.address &&
      state.selectedCountry?.countryCode &&
      state.quoteCurrency &&
      meldSupportedFiatCurrency &&
      state.quoteCurrency.meldCurrencyCode
      ? {
          sourceAmount: parseFloat(onRampInputAmount),
          sourceCurrencyCode:
            state.rampDirection === RampDirection.ONRAMP
              ? meldSupportedFiatCurrency.code
              : state.quoteCurrency.meldCurrencyCode,
          destinationCurrencyCode:
            state.rampDirection === RampDirection.ONRAMP
              ? state.quoteCurrency.meldCurrencyCode
              : meldSupportedFiatCurrency.code,
          countryCode: state.selectedCountry.countryCode,
          walletAddress: account.address,
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
    if (quotesError && isFiatOnRampApiError(quotesError)) {
      if (isInvalidRequestAmountTooLow(quotesError)) {
        const error = quotesError as InvalidRequestAmountTooLow
        const isFiat = error.data.context.unit === 'fiat'
        const quoteCurrency = state.quoteCurrency?.currencyInfo?.currency
        const formattedAmount = formatFORErrorAmount(
          error.data.context.minimumAllowed,
          isFiat,
          meldSupportedFiatCurrency,
          quoteCurrency,
          formatNumberOrString,
          getSymbolDisplayText,
        )

        if (!formattedAmount) {
          return new BuyFormError(t('common.card.error.description'))
        }

        return new BuyFormError(t(`fiatOnRamp.error.min`, { amount: formattedAmount }))
      }

      if (isInvalidRequestAmountTooHigh(quotesError)) {
        const error = quotesError as InvalidRequestAmountTooHigh
        const quoteCurrency = state.quoteCurrency?.currencyInfo?.currency
        const isFiat = error.data.context.unit === 'fiat'
        const formattedAmount = formatFORErrorAmount(
          error.data.context.maximumAllowed,
          isFiat,
          meldSupportedFiatCurrency,
          quoteCurrency,
          formatNumberOrString,
          getSymbolDisplayText,
        )

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
    if (quotes?.quotes && quotes.quotes.length === 0) {
      return new BuyFormError(t('fiatOnRamp.noQuotes.error'))
    }
    return undefined
  }, [
    formatNumberOrString,
    meldSupportedFiatCurrency,
    quotes?.quotes,
    quotesError,
    state.quoteCurrency?.currencyInfo?.currency,
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
