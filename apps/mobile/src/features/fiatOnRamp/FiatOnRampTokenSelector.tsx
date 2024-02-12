import React, { memo, useMemo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { TokenFiatOnRampList } from 'src/components/TokenSelector/TokenFiatOnRampList'
import Trace from 'src/components/Trace/Trace'
import { useFiatOnRampSupportedTokens } from 'src/features/fiatOnRamp/hooks'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/types'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { AnimatedFlex } from 'ui/src'

import { useAllCommonBaseCurrencies } from 'src/components/TokenSelector/hooks'
import { fromMoonpayNetwork } from 'wallet/src/features/chains/utils'
import { CurrencyInfo, GqlResult } from 'wallet/src/features/dataApi/types'
import { MoonpayCurrency } from 'wallet/src/features/fiatOnRamp/types'

interface Props {
  onBack: () => void
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
}

const findTokenOptionForMoonpayCurrency = (
  commonBaseCurrencies: CurrencyInfo[] | undefined,
  moonpayCurrency: MoonpayCurrency
): Maybe<CurrencyInfo> => {
  return (commonBaseCurrencies || []).find((item) => {
    const [code, network] = moonpayCurrency.code.split('_') ?? [undefined, undefined]
    const chainId = fromMoonpayNetwork(network)
    return (
      item &&
      code &&
      code === item.currency.symbol?.toLowerCase() &&
      chainId === item.currency.chainId
    )
  })
}

function useFiatOnRampTokenList(
  supportedTokens: MoonpayCurrency[] | undefined
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
        .map((moonpayCurrency) => ({
          currencyInfo: findTokenOptionForMoonpayCurrency(commonBaseCurrencies, moonpayCurrency),
          moonpayCurrencyCode: moonpayCurrency.code,
        }))
        .filter((item) => !!item.currencyInfo),
    [commonBaseCurrencies, supportedTokens]
  )

  return useMemo(
    () => ({
      data,
      loading: commonBaseCurrenciesLoading,
      error: commonBaseCurrenciesError,
      refetch: refetchCommonBaseCurrencies,
    }),
    [commonBaseCurrenciesError, commonBaseCurrenciesLoading, data, refetchCommonBaseCurrencies]
  )
}

function _FiatOnRampTokenSelector({ onSelectCurrency, onBack }: Props): JSX.Element {
  const {
    data: supportedTokens,
    isLoading: supportedTokensLoading,
    isError: supportedTokensQueryError,
    refetch: supportedTokensQueryRefetch,
  } = useFiatOnRampSupportedTokens()

  const {
    data: tokenList,
    loading: tokenListLoading,
    error: tokenListError,
    refetch: tokenListRefetch,
  } = useFiatOnRampTokenList(supportedTokens)

  const loading = supportedTokensLoading || tokenListLoading
  const error = Boolean(supportedTokensQueryError || tokenListError)
  const onRetry = (): void => {
    if (supportedTokensQueryError) {
      supportedTokensQueryRefetch?.()
    }
    if (tokenListError) {
      tokenListRefetch?.()
    }
  }

  return (
    <Trace
      logImpression
      element={ElementName.FiatOnRampTokenSelector}
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

export const FiatOnRampTokenSelector = memo(_FiatOnRampTokenSelector)
