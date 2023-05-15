import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { memo, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Box, Flex, Inset } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { useAllCommonBaseCurrencies } from 'src/components/TokenSelector/hooks'
import { TokenOptionItem } from 'src/components/TokenSelector/TokenOptionItem'
import { CurrencyInfo, GqlResult } from 'src/features/dataApi/types'
import { useFiatOnRampSupportedTokensQuery } from 'src/features/fiatOnRamp/api'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/FiatOnRampModal'
import { MoonpayCurrency } from 'src/features/fiatOnRamp/types'
import { ElementName } from 'src/features/telemetry/constants'
import { ChainId } from 'wallet/src/constants/chains'
import { EMPTY_ARRAY } from 'wallet/src/constants/misc'
import { logger } from 'wallet/src/features/logger/logger'
import { fromMoonpayNetwork } from 'wallet/src/utils/chainId'
import { CurrencyId } from 'wallet/src/utils/currencyId'

interface Props {
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  onBack: () => void
}

const findTokenOptionForMoonpayCurrency = (
  commonBaseCurrencies: CurrencyInfo[] | undefined,
  moonpayCurrency: MoonpayCurrency
): NullUndefined<CurrencyInfo> => {
  return (
    (commonBaseCurrencies || []).find((item) => {
      const [code, network] = moonpayCurrency.code.split('_') ?? [undefined, undefined]
      try {
        const chainId = fromMoonpayNetwork(network)
        return (
          item &&
          code &&
          code === item.currency.symbol?.toLowerCase() &&
          chainId === item.currency.chainId
        )
      } catch (error) {
        logger.error('TokenFiatOnRampList', 'findTokenOptionForMoonpayCurrency', `${error}`)
        return false
      }
    }) ?? null
  )
}

function useFiatOnRampTokenSection(
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

function _TokenFiatOnRampList({ onSelectCurrency, onBack }: Props): JSX.Element {
  const { t } = useTranslation()

  const flatListRef = useRef(null)

  const {
    data: supportedTokens,
    isLoading: supportedTokensLoading,
    isError: supportedTokensQueryError,
    refetch: supportedTokensQueryRefetch,
  } = useFiatOnRampSupportedTokensQuery()

  const { data, loading, error, refetch } = useFiatOnRampTokenSection(supportedTokens)

  const renderItem = useCallback(
    ({ item: currency }: ListRenderItemInfo<FiatOnRampCurrency>) => {
      if (!currency.currencyInfo) {
        return null
      }
      return (
        <TokenOptionItem
          option={{ currencyInfo: currency.currencyInfo, quantity: 0, balanceUSD: 0 }}
          showNetworkPill={currency.currencyInfo.currency.chainId !== ChainId.Mainnet}
          onPress={(): void => onSelectCurrency?.(currency)}
        />
      )
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
            title={t("Couldn't load tokens to buy")}
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
        data={data ?? EMPTY_ARRAY}
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
  const theme = useAppTheme()
  const { t } = useTranslation()
  return (
    <Flex row justifyContent="space-between" my="spacing16">
      <TouchableArea name={ElementName.Back} testID={ElementName.Back} onPress={onBack}>
        <Chevron color={theme.colors.textPrimary} />
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
