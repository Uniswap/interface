import { memo, useCallback, useState } from 'react'
import { TokenOptionItem as BaseTokenOptionItem } from 'uniswap/src/components/TokenSelector/items/TokenOptionItem'
import { HorizontalTokenList } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'
import { OnSelectCurrency, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { ItemRowInfo } from 'uniswap/src/components/lists/TokenSectionBaseList/TokenSectionBaseList'
import { TokenOption, TokenSelectorItemTypes } from 'uniswap/src/components/lists/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { CurrencyId } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'

function isHorizontalListTokenItem(data: TokenSelectorItemTypes): data is TokenOption[] {
  return Array.isArray(data)
}

const TokenOptionItem = memo(function _TokenOptionItem({
  tokenOption,
  onSelectCurrency,
  section,
  index,
  showWarnings,
  showTokenAddress,
  isKeyboardOpen,
}: {
  tokenOption: TokenOption
  section: TokenSection<TokenOption>
  index: number
  showWarnings: boolean
  showTokenAddress?: boolean
  isKeyboardOpen?: boolean
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const onPress = useCallback(
    () => onSelectCurrency(tokenOption.currencyInfo, section, index),
    [index, onSelectCurrency, section, tokenOption.currencyInfo],
  )

  const { isTestnetModeEnabled } = useEnabledChains()

  const { tokenWarningDismissed } = useDismissedTokenWarnings(tokenOption.currencyInfo.currency)

  const tokenBalance = formatNumberOrString({
    value: tokenOption.quantity,
    type: NumberType.TokenTx,
  })

  const fiatBalance = convertFiatAmountFormatted(tokenOption.balanceUSD, NumberType.FiatTokenPrice)

  const title = isTestnetModeEnabled ? tokenBalance : fiatBalance
  const subtitle = isTestnetModeEnabled ? undefined : tokenBalance

  return (
    <BaseTokenOptionItem
      balance={title}
      isKeyboardOpen={isKeyboardOpen}
      option={tokenOption}
      quantity={tokenOption.quantity}
      quantityFormatted={subtitle}
      showTokenAddress={showTokenAddress}
      showWarnings={showWarnings}
      tokenWarningDismissed={tokenWarningDismissed}
      onPress={onPress}
    />
  )
})

interface TokenSelectorListProps {
  onSelectCurrency: OnSelectCurrency
  sections?: TokenSection<TokenSelectorItemTypes>[]
  chainFilter?: UniverseChainId | null
  showTokenWarnings: boolean
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  showTokenAddress?: boolean
  isKeyboardOpen?: boolean
}

function _TokenSelectorList({
  onSelectCurrency,
  sections,
  chainFilter,
  showTokenWarnings,
  isKeyboardOpen,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  showTokenAddress,
}: TokenSelectorListProps): JSX.Element {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  usePerformanceLogger(DDRumManualTiming.TokenSelectorListRender, [chainFilter])

  const handleExpand = useCallback(
    (item: TokenSelectorItemTypes) => {
      setExpandedItems((prev) => [...prev, key(item)])
    },
    [setExpandedItems],
  )

  const isExpandedItem = useCallback(
    (item: TokenOption[]) => {
      return expandedItems.includes(key(item))
    },
    [expandedItems],
  )

  const renderItem = useCallback(
    ({ item, section, index }: ItemRowInfo<TokenSelectorItemTypes>) => {
      if (isHorizontalListTokenItem(item)) {
        return (
          <HorizontalTokenList
            tokens={item}
            section={section as TokenSection<TokenOption[]>}
            index={index}
            expanded={isExpandedItem(item)}
            onSelectCurrency={onSelectCurrency}
            onExpand={() => handleExpand(item)}
          />
        )
      }
      return (
        <TokenOptionItem
          index={index}
          isKeyboardOpen={isKeyboardOpen}
          section={section as TokenSection<TokenOption>}
          showTokenAddress={showTokenAddress}
          showWarnings={showTokenWarnings}
          tokenOption={item}
          onSelectCurrency={onSelectCurrency}
        />
      )
    },
    [onSelectCurrency, showTokenAddress, showTokenWarnings, isKeyboardOpen, handleExpand, isExpandedItem],
  )

  return (
    <SelectorBaseList
      renderItem={renderItem}
      sections={sections}
      chainFilter={chainFilter}
      refetch={refetch}
      loading={loading}
      hasError={hasError}
      emptyElement={emptyElement}
      errorText={errorText}
      keyExtractor={key}
      expandedItems={expandedItems}
    />
  )
}

function key(item: TokenSelectorItemTypes): CurrencyId {
  if (isHorizontalListTokenItem(item)) {
    return item.map((token) => token.currencyInfo.currencyId).join('-')
  }

  return item.currencyInfo.currencyId
}

export const TokenSelectorList = memo(_TokenSelectorList)
