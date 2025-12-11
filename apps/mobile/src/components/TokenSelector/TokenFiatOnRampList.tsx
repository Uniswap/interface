import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { Flex, Inset, Loader } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { TokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { FiatOnRampCurrency, FORCurrencyOrBalance } from 'uniswap/src/features/fiatOnRamp/types'
import { getUnsupportedFORTokensWithBalance, isSupportedFORCurrency } from 'uniswap/src/features/fiatOnRamp/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getTokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import { ListSeparatorToggle } from 'uniswap/src/features/transactions/TransactionDetails/ListSeparatorToggle'
import { CurrencyId } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'

interface Props {
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  onRetry: () => void
  error: boolean
  loading: boolean
  list: FiatOnRampCurrency[] | undefined
  balancesById: Record<string, PortfolioBalance> | undefined
  selectedCurrency?: FiatOnRampCurrency
  isOffRamp: boolean
}

function TokenOptionItemWrapper({
  currency,
  onSelectCurrency,
  currencyBalance,
  isSelected,
  showUnsupported,
}: {
  currency: FORCurrencyOrBalance
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  currencyBalance: Maybe<PortfolioBalance>
  isSelected?: boolean
  showUnsupported?: boolean
}): JSX.Element | null {
  const { currencyInfo } = currency
  const { quantity, balanceUSD } = currencyBalance || {}
  const isUnsupported = !isSupportedFORCurrency(currency)

  const option: TokenOption | null = useMemo(
    () =>
      currencyInfo
        ? { type: OnchainItemListOptionType.Token, currencyInfo, quantity: quantity || null, balanceUSD, isUnsupported }
        : null,
    [currencyInfo, balanceUSD, quantity, isUnsupported],
  )
  const onPress = useCallback(() => onSelectCurrency(currency), [currency, onSelectCurrency])
  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo)
  const { tokenWarningDismissed } = useDismissedTokenWarnings(currencyInfo?.currency, tokenProtectionWarning)
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  if (!option) {
    return null
  }

  if (!showUnsupported && isUnsupported) {
    return null
  }

  return (
    <TokenOptionItem
      balance={convertFiatAmountFormatted(option.balanceUSD, NumberType.FiatTokenPrice)}
      isSelected={isSelected}
      option={option}
      quantity={option.quantity}
      quantityFormatted={formatNumberOrString({ value: option.quantity, type: NumberType.TokenTx })}
      showWarnings={false}
      tokenWarningDismissed={tokenWarningDismissed}
      onPress={onPress}
    />
  )
}

function _TokenFiatOnRampList({
  onSelectCurrency,
  error,
  onRetry,
  list = [],
  loading,
  balancesById,
  selectedCurrency,
  isOffRamp,
}: Props): JSX.Element {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(true)

  enum ListSection {
    SUPPORTED = 'SUPPORTED',
    UNSUPPORTED = 'UNSUPPORTED',
  }

  const sortedSupportedAssetsWithBalance = list
    .filter((c) => {
      if (!c.currencyInfo) {
        return false
      }

      const quantity = balancesById?.[c.currencyInfo.currencyId]?.quantity ?? 0
      return quantity > 0
    })
    .sort((a, b) => {
      if (!a.currencyInfo || !b.currencyInfo) {
        return 0
      }

      const aQuantity = balancesById?.[a.currencyInfo.currencyId]?.balanceUSD ?? 0
      const bQuantity = balancesById?.[b.currencyInfo.currencyId]?.balanceUSD ?? 0
      return bQuantity - aQuantity
    })
  const supportedAssetsWithoutBalance = list.filter((c) => c.currencyInfo && !balancesById?.[c.currencyInfo.currencyId])
  const unsupportedAssetsWithBalance = getUnsupportedFORTokensWithBalance(list, balancesById)

  const tokenList = isOffRamp
    ? [
        { title: ListSection.SUPPORTED, data: [...sortedSupportedAssetsWithBalance, ...supportedAssetsWithoutBalance] },
        { title: ListSection.UNSUPPORTED, data: unsupportedAssetsWithBalance },
      ]
    : [{ title: ListSection.SUPPORTED, data: list }]
  const flatListRef = useRef(null)
  const renderItem = useCallback(
    ({ item: currency }: ListRenderItemInfo<FORCurrencyOrBalance>) => {
      const { currencyInfo } = currency
      const currencyBalance = currencyInfo && balancesById?.[currencyInfo.currencyId]

      return (
        <TokenOptionItemWrapper
          currency={currency}
          currencyBalance={currencyBalance}
          isSelected={currency.currencyInfo?.currencyId === selectedCurrency?.currencyInfo?.currencyId}
          showUnsupported={showMore}
          onSelectCurrency={onSelectCurrency}
        />
      )
    },
    [onSelectCurrency, balancesById, selectedCurrency, showMore],
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
    <BottomSheetSectionList
      ref={flatListRef}
      ListEmptyComponent={<Flex />}
      ListFooterComponent={<Inset all="$spacing36" />}
      keyExtractor={key}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
      renderItem={renderItem}
      renderSectionHeader={({ section }) => {
        if (section.title !== ListSection.UNSUPPORTED) {
          return <></>
        }

        if (section.data.length === 0) {
          return <></>
        }

        return (
          <Flex mt="$spacing12">
            <ListSeparatorToggle
              closedText={t('fiatOffRamp.unsupportedToken.divider')}
              isOpen={showMore}
              openText={t('fiatOffRamp.unsupportedToken.divider')}
              onPress={(): void => {
                setShowMore(!showMore)
              }}
            />
          </Flex>
        )
      }}
      sections={tokenList}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      windowSize={5}
    />
  )
}

function key(item: FiatOnRampCurrency): CurrencyId {
  return item.currencyInfo?.currencyId ?? ''
}

export const TokenFiatOnRampList = memo(_TokenFiatOnRampList)
