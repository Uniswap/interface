import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { memo, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { Loader } from 'src/components/loading'
import { TokenOptionItem } from 'src/components/TokenSelector/TokenOptionItem'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/types'
import { ElementName } from 'src/features/telemetry/constants'
import { Flex, Icons, Inset, Text, TouchableArea } from 'ui/src'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyId } from 'wallet/src/utils/currencyId'

interface Props {
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  onBack: () => void
  onRetry: () => void
  error: boolean
  loading: boolean
  list: FiatOnRampCurrency[] | undefined
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

function _TokenFiatOnRampList({
  onSelectCurrency,
  onBack,
  error,
  onRetry,
  list,
  loading,
}: Props): JSX.Element {
  const { t } = useTranslation()

  const flatListRef = useRef(null)

  const renderItem = useCallback(
    ({ item: currency }: ListRenderItemInfo<FiatOnRampCurrency>) => {
      return <TokenOptionItemWrapper currency={currency} onSelectCurrency={onSelectCurrency} />
    },
    [onSelectCurrency]
  )

  if (error) {
    return (
      <>
        <Header onBack={onBack} />
        <Flex centered grow>
          <BaseCard.ErrorState
            retryButtonLabel="Retry"
            title={t('Couldn’t load tokens to buy')}
            onRetry={onRetry}
          />
        </Flex>
      </>
    )
  }

  if (loading) {
    return (
      <Flex>
        <Header onBack={onBack} />
        <Loader.Token repeat={5} />
      </Flex>
    )
  }

  return (
    <Flex grow>
      <Header onBack={onBack} />
      <BottomSheetFlatList
        ref={flatListRef}
        ListEmptyComponent={<Flex />}
        ListFooterComponent={<Inset all="$spacing36" />}
        data={list}
        keyExtractor={key}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        windowSize={5}
      />
    </Flex>
  )
}

function Header({ onBack }: { onBack: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row justifyContent="space-between" my="$spacing16">
      <TouchableArea testID={ElementName.Back} onPress={onBack}>
        <Icons.RotatableChevron color="$neutral1" />
      </TouchableArea>
      <Text variant="body1">{t('Select a token to buy')}</Text>
      <Flex width={24} />
    </Flex>
  )
}

function key(item: FiatOnRampCurrency): CurrencyId {
  return item.currencyInfo?.currencyId ?? ''
}

export const TokenFiatOnRampList = memo(_TokenFiatOnRampList)
