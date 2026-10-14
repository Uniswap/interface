import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Flex, Inset, Loader, UniversalList, type UniversalListRenderItemInfo } from '@universe/mycelium'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  buildFiatOnRampRows,
  type FiatOnRampRow,
  FiatOnRampRowType,
} from 'src/components/TokenSelector/buildFiatOnRampRows'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { TokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/TokenOptionItem'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { FiatOnRampCurrency, FORCurrencyOrBalance } from 'uniswap/src/features/fiatOnRamp/types'
import { isSupportedFORCurrency, normalizeBalancesByIdForLookup } from 'uniswap/src/features/fiatOnRamp/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getTokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import { ListSeparatorToggle } from 'uniswap/src/features/transactions/TransactionDetails/ListSeparatorToggle'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
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
}: {
  currency: FORCurrencyOrBalance
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
  currencyBalance: Maybe<PortfolioBalance>
  isSelected?: boolean
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

function TokenFiatOnRampListInner({
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

  const rows = useMemo(
    () => buildFiatOnRampRows({ list, balancesById, isOffRamp, showMore }),
    [list, balancesById, isOffRamp, showMore],
  )
  const normalizedBalancesById = useMemo(() => normalizeBalancesByIdForLookup(balancesById), [balancesById])

  const renderItem = useCallback(
    ({ item }: UniversalListRenderItemInfo<FiatOnRampRow>): JSX.Element => {
      if (item.type === FiatOnRampRowType.UnsupportedToggle) {
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
      }

      const { currency } = item
      const { currencyInfo } = currency
      const currencyBalance =
        currencyInfo && normalizedBalancesById?.[normalizeCurrencyIdForMapLookup(currencyInfo.currencyId)]

      return (
        <TokenOptionItemWrapper
          currency={currency}
          currencyBalance={currencyBalance}
          isSelected={currency.currencyInfo?.currencyId === selectedCurrency?.currencyInfo?.currencyId}
          onSelectCurrency={onSelectCurrency}
        />
      )
    },
    [onSelectCurrency, normalizedBalancesById, selectedCurrency, showMore, t],
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
    <UniversalList
      data={rows}
      getItemType={rowType}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
      keyExtractor={rowKey}
      ListEmptyComponent={<Flex />}
      ListFooterComponent={<Inset all="$spacing36" />}
      renderItem={renderItem}
      // Always rendered inside a bottom sheet, so scroll gestures route through the sheet's scrollable.
      renderScrollComponent={BottomSheetScrollView}
      showsVerticalScrollIndicator={false}
    />
  )
}

// Module scope rather than inline: the engine keys an internal memo on `keyExtractor` identity, and
// `getItemType` is documented as needing a stable reference.
function rowKey(item: FiatOnRampRow): string {
  return item.key
}

function rowType(item: FiatOnRampRow): FiatOnRampRowType {
  return item.type
}

export const TokenFiatOnRampList = memo(TokenFiatOnRampListInner)
