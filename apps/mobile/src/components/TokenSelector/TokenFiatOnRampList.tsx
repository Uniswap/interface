import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { memo, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/types'
import { Flex, Inset, Loader } from 'ui/src'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { TokenOptionItem } from 'wallet/src/components/TokenSelector/TokenOptionItem'
import { useBottomSheetFocusHook } from 'wallet/src/components/modals/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyId } from 'wallet/src/utils/currencyId'

interface Props {
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
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
      <Flex centered grow>
        <BaseCard.ErrorState
          retryButtonLabel={t('common.button.retry')}
          title={t('fiatOnRamp.error.load')}
          onRetry={onRetry}
        />
      </Flex>
    )
  }

  if (loading) {
    return <Loader.Token repeat={5} />
  }

  return (
    <BottomSheetFlatList
      ref={flatListRef}
      ListEmptyComponent={<Flex />}
      ListFooterComponent={<Inset all="$spacing36" />}
      data={list}
      focusHook={useBottomSheetFocusHook}
      keyExtractor={key}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      windowSize={5}
    />
  )
}

function key(item: FiatOnRampCurrency): CurrencyId {
  return item.currencyInfo?.currencyId ?? ''
}

export const TokenFiatOnRampList = memo(_TokenFiatOnRampList)
