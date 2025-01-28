import { skipToken } from '@reduxjs/toolkit/query/react'
import { useUSDTokenUpdater } from 'hooks/useUSDTokenUpdater'
import { useFiatOnRampSupportedTokens, useMeldFiatCurrencyInfo } from 'pages/Swap/Buy/hooks'
import { formatFiatOnRampFiatAmount } from 'pages/Swap/Buy/shared'
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
  InvalidRequestAmountTooLow,
  isFiatOnRampApiError,
  isInvalidRequestAmountTooHigh,
  isInvalidRequestAmountTooLow,
} from 'uniswap/src/features/fiatOnRamp/utils'
import { useAccount } from 'wagmi'

class BuyFormError extends Error {
  constructor(public readonly message: string) {
    super(message)
  }
}

type BuyFormState = {
  readonly inputAmount: string
  readonly quoteCurrency: Maybe<FiatOnRampCurrency>
  readonly selectedCountry?: FORCountry
  readonly countryModalOpen: boolean
  readonly currencyModalOpen: boolean
  readonly providerModalOpen: boolean
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
  quoteCurrency: undefined,
  selectedCountry: undefined,
  countryModalOpen: false,
  currencyModalOpen: false,
  providerModalOpen: false,
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
    true /* inputInFiat */,
    state.inputAmount,
    state.quoteCurrency?.currencyInfo?.currency,
  )

  const { meldSupportedFiatCurrency, notAvailableInThisRegion } = useMeldFiatCurrencyInfo(state.selectedCountry)

  const { data: countryOptionsResult } = useFiatOnRampAggregatorCountryListQuery({
    rampDirection: RampDirection.ONRAMP,
  })
  const supportedTokens = useFiatOnRampSupportedTokens(meldSupportedFiatCurrency, state.selectedCountry?.countryCode)

  const {
    data: quotes,
    isFetching: fetchingQuotes,
    error: quotesError,
  } = useFiatOnRampAggregatorCryptoQuoteQuery(
    state.inputAmount &&
      state.inputAmount !== '' &&
      account.address &&
      state.selectedCountry?.countryCode &&
      state.quoteCurrency &&
      meldSupportedFiatCurrency
      ? {
          sourceAmount: parseFloat(state.inputAmount),
          sourceCurrencyCode: meldSupportedFiatCurrency.code,
          destinationCurrencyCode: state.quoteCurrency.meldCurrencyCode ?? 'ETH',
          countryCode: state.selectedCountry.countryCode,
          walletAddress: account.address,
          state: state.selectedCountry.state,
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: true,
    },
  )

  const error = useMemo(() => {
    if (quotesError && isFiatOnRampApiError(quotesError)) {
      if (isInvalidRequestAmountTooLow(quotesError)) {
        const formattedAmount = formatFiatOnRampFiatAmount(
          (quotesError as InvalidRequestAmountTooLow).data.context.minimumAllowed,
          meldSupportedFiatCurrency,
        )
        return new BuyFormError(t(`fiatOnRamp.error.min`, { amount: formattedAmount }))
      }
      if (isInvalidRequestAmountTooHigh(quotesError)) {
        const formattedAmount = formatFiatOnRampFiatAmount(
          quotesError.data.context.maximumAllowed,
          meldSupportedFiatCurrency,
        )
        return new BuyFormError(t(`fiatOnRamp.error.max`, { amount: formattedAmount }))
      }
      return new BuyFormError(t('common.card.error.description'))
    }
    if (quotes?.quotes && quotes.quotes.length === 0) {
      return new BuyFormError(t('fiatOnRamp.noQuotes.error'))
    }
    return undefined
  }, [meldSupportedFiatCurrency, quotes?.quotes, quotesError, t])

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

export function BuyFormContextProvider({ children }: PropsWithChildren) {
  const [buyFormState, setBuyFormState] = useState<BuyFormState>({ ...DEFAULT_BUY_FORM_STATE })
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
