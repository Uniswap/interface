import React, { memo, useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { TokenFiatOnRampList } from 'src/components/TokenSelector/TokenFiatOnRampList'
import Trace from 'src/components/Trace/Trace'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/types'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { AnimatedFlex } from 'ui/src'

import { useAllCommonBaseCurrencies } from 'src/components/TokenSelector/hooks'
import { CurrencyInfo, GqlResult } from 'wallet/src/features/dataApi/types'
import { useFiatOnRampAggregatorSupportedTokensQuery } from 'wallet/src/features/fiatOnRamp/api'
import { MeldCryptoCurrency } from 'wallet/src/features/fiatOnRamp/meld'

interface Props {
  onBack: () => void
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  sourceCurrencyCode: string
  countryCode: string
}

const findTokenOptionForMeldCurrency = (
  commonBaseCurrencies: CurrencyInfo[] | undefined,
  meldCurrency: MeldCryptoCurrency
): Maybe<CurrencyInfo> => {
  return (commonBaseCurrencies || []).find(
    (item) =>
      item &&
      meldCurrency.cryptoCurrencyCode.toLowerCase() === item.currency.symbol?.toLowerCase() &&
      meldCurrency.chainId === item.currency.chainId.toString()
  )
}

function useFiatOnRampTokenList(
  supportedTokens: MeldCryptoCurrency[] | undefined
): GqlResult<FiatOnRampCurrency[]> {
  const {
    data: commonBaseCurrencies,
    error: commonBaseCurrenciesError,
    loading: commonBaseCurrenciesLoading,
    refetch: refetchCommonBaseCurrencies,
  } = useAllCommonBaseCurrencies()

  const data = useMemo(
    () =>
      (supportedTokens || [])
        .map((meldCurrency) => ({
          currencyInfo: findTokenOptionForMeldCurrency(commonBaseCurrencies, meldCurrency),
        }))
        .filter((item) => !!item.currencyInfo),
    [commonBaseCurrencies, supportedTokens]
  )

  return {
    data,
    loading: commonBaseCurrenciesLoading,
    error: commonBaseCurrenciesError,
    refetch: refetchCommonBaseCurrencies,
  }
}

function _FiatOnRampAggregatorTokenSelector({
  onSelectCurrency,
  onBack,
  sourceCurrencyCode,
  countryCode,
}: Props): JSX.Element {
  const {
    data: supportedTokens,
    isLoading: supportedTokensLoading,
    error: supportedTokensQueryError,
    refetch: supportedTokensQueryRefetch,
  } = useFiatOnRampAggregatorSupportedTokensQuery({ fiatCurrency: sourceCurrencyCode, countryCode })

  const {
    data: tokenList,
    loading: tokenListLoading,
    error: tokenListError,
    refetch: tokenListRefetch,
  } = useFiatOnRampTokenList(supportedTokens)

  const loading = supportedTokensLoading || tokenListLoading
  const error = Boolean(supportedTokensQueryError || tokenListError)
  const onRetry = async (): Promise<void> => {
    if (supportedTokensQueryError) {
      await supportedTokensQueryRefetch?.()
    }
    if (tokenListError) {
      tokenListRefetch?.()
    }
  }

  return (
    <Trace
      logImpression
      element={ElementName.FiatOnRampAggregatorTokenSelector}
      section={SectionName.TokenSelector}>
      <AnimatedFlex
        entering={FadeIn}
        exiting={FadeOut}
        gap="$spacing12"
        overflow="hidden"
        px="$spacing16"
        width="100%">
        <TokenFiatOnRampList
          error={error}
          list={tokenList}
          loading={loading}
          onBack={onBack}
          onRetry={onRetry}
          onSelectCurrency={onSelectCurrency}
        />
      </AnimatedFlex>
    </Trace>
  )
}

export const FiatOnRampAggregatorTokenSelector = memo(_FiatOnRampAggregatorTokenSelector)
