import { meldSupportedCurrencyToCurrencyInfo } from 'appGraphql/data/types'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import {
  getFiatCurrencyName,
  useAppFiatCurrency,
  useFiatCurrencyComponents,
} from 'uniswap/src/features/fiatCurrency/hooks'
import {
  useFiatOnRampAggregatorSupportedFiatCurrenciesQuery,
  useFiatOnRampAggregatorSupportedTokensQuery,
} from 'uniswap/src/features/fiatOnRamp/api'
import {
  FiatCurrencyInfo,
  FiatOnRampCurrency,
  FORCountry,
  OffRampTransferDetailsRequest,
} from 'uniswap/src/features/fiatOnRamp/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
// biome-ignore lint/style/noRestrictedImports: Buy hooks need direct SDK imports
import { getFiatCurrencyComponents } from 'utilities/src/format/localeBased'

type FiatOnRampCurrencyInfo = {
  meldSupportedFiatCurrency: FiatCurrencyInfo
  notAvailableInThisRegion: boolean
}

export const fallbackCurrencyInfo: FiatCurrencyInfo = {
  ...getFiatCurrencyComponents('en-US', 'USD'),
  symbol: '$',
  name: 'United States Dollar',
  shortName: 'USD',
  code: 'USD',
}

/**
 * Returns the meld-supported fiat currency info based on user-selected country,
 * the local currency active in the user's app settings, with a fallback to USD.
 */
export function useMeldFiatCurrencyInfo(selectedCountry?: FORCountry): FiatOnRampCurrencyInfo {
  const { data: supportedFiatCurrencies } = useFiatOnRampAggregatorSupportedFiatCurrenciesQuery({
    countryCode: selectedCountry?.countryCode ?? 'US',
  })

  const activeLocalCurrency = useAppFiatCurrency()
  const fiatCurrencyComponents = useFiatCurrencyComponents(activeLocalCurrency)
  const { t } = useTranslation()

  const appFiatCurrencySupported =
    supportedFiatCurrencies &&
    supportedFiatCurrencies.fiatCurrencies.some(
      (currency): boolean => activeLocalCurrency.toLowerCase() === currency.fiatCurrencyCode.toLowerCase(),
    )
  const meldSupportedFiatCurrency: FiatCurrencyInfo = useMemo(() => {
    const { name, shortName } = getFiatCurrencyName(t, activeLocalCurrency)
    const activeLocalCurrencyFiatCurrencyInfo: FiatCurrencyInfo = {
      ...fiatCurrencyComponents,
      name,
      shortName,
      code: activeLocalCurrency,
    }
    return appFiatCurrencySupported ? activeLocalCurrencyFiatCurrencyInfo : fallbackCurrencyInfo
  }, [activeLocalCurrency, appFiatCurrencySupported, fiatCurrencyComponents, t])

  return {
    meldSupportedFiatCurrency,
    notAvailableInThisRegion: supportedFiatCurrencies?.fiatCurrencies.length === 0,
  }
}

export function useFiatOnRampSupportedTokens(
  fiatCurrency: FiatCurrencyInfo,
  countryCode?: string,
): FiatOnRampCurrency[] {
  const isSolanaEnabled = useFeatureFlag(FeatureFlags.Solana)
  const { data: quoteCurrencyOptions } = useFiatOnRampAggregatorSupportedTokensQuery({
    fiatCurrency: fiatCurrency.code,
    countryCode: countryCode ?? 'US',
    isSolanaEnabled,
  })

  return useMemo(() => {
    return (
      quoteCurrencyOptions?.supportedTokens.map((currency) => {
        const meldCurrencyCode = currency.cryptoCurrencyCode
        const currencyInfo = meldSupportedCurrencyToCurrencyInfo(currency)
        return { currencyInfo, meldCurrencyCode }
      }) ?? []
    )
  }, [quoteCurrencyOptions?.supportedTokens])
}

export function useOffRampTransferDetailsRequest(): Maybe<OffRampTransferDetailsRequest> {
  const [searchParams] = useSearchParams()

  const externalTransactionId = searchParams.get('externalTransactionId')
  const baseCurrencyCode = searchParams.get('baseCurrencyCode')
  const baseCurrencyAmount = searchParams.get('baseCurrencyAmount')
  const depositWalletAddress = searchParams.get('depositWalletAddress')

  return useMemo(() => {
    if (baseCurrencyCode && baseCurrencyAmount && depositWalletAddress) {
      return {
        moonpayDetails: {
          baseCurrencyCode,
          baseCurrencyAmount: Number(baseCurrencyAmount),
          depositWalletAddress,
        },
      }
    } else if (externalTransactionId) {
      return {
        meldDetails: { sessionId: externalTransactionId },
      }
    }

    return null
  }, [baseCurrencyCode, baseCurrencyAmount, depositWalletAddress, externalTransactionId])
}
