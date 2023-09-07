import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { memo, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex, Inset } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { useAllCommonBaseCurrencies } from 'src/components/TokenSelector/hooks'
import { TokenOptionItem } from 'src/components/TokenSelector/TokenOptionItem'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/FiatOnRampModal'
import { useFiatOnRampSupportedTokens } from 'src/features/fiatOnRamp/hooks'
import { ElementName } from 'src/features/telemetry/constants'
import { Icons } from 'ui/src'
import { ChainId } from 'wallet/src/constants/chains'
import { fromMoonpayNetwork } from 'wallet/src/features/chains/utils'
import { CurrencyInfo, GqlResult } from 'wallet/src/features/dataApi/types'
import { MoonpayCurrency } from 'wallet/src/features/fiatOnRamp/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'

interface Props {
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  onBack: () => void
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
          moonpayCurrency,
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

function TokenOptionItemWrapper({
  currency,
  onSelectCurrency,
}: {
  currency: FiatOnRampCurrency
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
}): JSX.Element | null {
  const { currencyInfo } = currency

  const option = useMemo(
    // we need to convert to TokenOption without quantity and balanceUSD
    // to use in Token Selector
    () => (currencyInfo ? { currencyInfo, quantity: 0, balanceUSD: 0 } : null),
    [currencyInfo]
  )
  const onPress = useCallback(() => onSelectCurrency?.(currency), [currency, onSelectCurrency])

  if (!option) {
    return null
  }

  return (
    <TokenOptionItem
      option={option}
      showNetworkPill={currencyInfo?.currency.chainId !== ChainId.Mainnet}
      showWarnings={true}
      onPress={onPress}
    />
  )
}

function _TokenFiatOnRampList({ onSelectCurrency, onBack }: Props): JSX.Element {
  const { t } = useTranslation()

  const flatListRef = useRef(null)

  const {
    data: supportedTokens,
    isLoading: supportedTokensLoading,
    isError: supportedTokensQueryError,
    refetch: supportedTokensQueryRefetch,
  } = useFiatOnRampSupportedTokens()

  const { data, loading, error, refetch } = useFiatOnRampTokenList(supportedTokens)

  const renderItem = useCallback(
    ({ item: currency }: ListRenderItemInfo<FiatOnRampCurrency>) => {
      return <TokenOptionItemWrapper currency={currency} onSelectCurrency={onSelectCurrency} />
    },
    [onSelectCurrency]
  )

  if (supportedTokensQueryError || error) {
    return (
      <>
        <Header onBack={onBack} />
        <Box alignItems="center" flexGrow={1} justifyContent="center">
          <BaseCard.ErrorState
            retryButtonLabel="Retry"
            title={t('Couldn’t load tokens to buy')}
            onRetry={(): void => {
              if (supportedTokensQueryError) {
                supportedTokensQueryRefetch?.()
              }
              if (error) {
                refetch?.()
              }
            }}
          />
        </Box>
      </>
    )
  }

  if (supportedTokensLoading || loading) {
    return (
      <Box>
        <Header onBack={onBack} />
        <Loader.Token repeat={5} />
      </Box>
    )
  }

  return (
    <Box flexGrow={1}>
      <Header onBack={onBack} />
      <BottomSheetFlatList
        ref={flatListRef}
        ListEmptyComponent={<Flex />}
        ListFooterComponent={<Inset all="spacing36" />}
        data={data}
        keyExtractor={key}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        windowSize={5}
      />
    </Box>
  )
}

function Header({ onBack }: { onBack: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row justifyContent="space-between" my="spacing16">
      <TouchableArea testID={ElementName.Back} onPress={onBack}>
        <Icons.RotatableChevron color="$neutral1" />
      </TouchableArea>
      <Text variant="bodyLarge">{t('Select a token to buy')}</Text>
      <Box width={24} />
    </Flex>
  )
}

function key(item: FiatOnRampCurrency): CurrencyId {
  return item.currencyInfo?.currencyId ?? ''
}

export const TokenFiatOnRampList = memo(_TokenFiatOnRampList)
