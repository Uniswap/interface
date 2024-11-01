import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimateTransition, Flex, Loader, Skeleton, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { HorizontalTokenList } from 'uniswap/src/components/TokenSelector/HorizontalTokenList/HorizontalTokenList'
import { TokenOptionItem } from 'uniswap/src/components/TokenSelector/TokenOptionItem'
import {
  TokenSectionBaseList,
  TokenSectionBaseListRef,
} from 'uniswap/src/components/TokenSelector/TokenSectionBaseList'
import { ITEM_SECTION_HEADER_ROW_HEIGHT } from 'uniswap/src/components/TokenSelector/TokenSectionBaseList.web'
import { SectionHeader, TokenSectionHeaderProps } from 'uniswap/src/components/TokenSelector/TokenSectionHeader'
import { OnSelectCurrency, TokenOption, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { useBottomSheetFocusHook } from 'uniswap/src/components/modals/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyId } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'

function isHorizontalListTokenItem(data: TokenOption | TokenOption[]): data is TokenOption[] {
  return Array.isArray(data)
}

const TokenOptionItemWrapper = memo(function _TokenOptionItemWrapper({
  tokenOption,
  onSelectCurrency,
  section,
  index,
  showWarnings,
  showTokenAddress,
  isKeyboardOpen,
}: {
  tokenOption: TokenOption
  section: TokenSection
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

  const { tokenWarningDismissed, onDismissTokenWarning: dismissWarningCallback } = useDismissedTokenWarnings(
    tokenOption.currencyInfo.currency,
  )

  const tokenBalance = formatNumberOrString({
    value: tokenOption.quantity,
    type: NumberType.TokenTx,
  })

  const fiatBalance = convertFiatAmountFormatted(tokenOption.balanceUSD, NumberType.FiatTokenPrice)

  const title = isTestnetModeEnabled ? tokenBalance : fiatBalance
  const subtitle = isTestnetModeEnabled ? undefined : tokenBalance

  return (
    <TokenOptionItem
      balance={title}
      dismissWarningCallback={dismissWarningCallback}
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

function EmptyResults(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex>
      <Text color="$neutral3" mt="$spacing16" textAlign="center" variant="subheading2">
        {t('common.noResults')}
      </Text>
    </Flex>
  )
}

interface TokenSelectorListProps {
  onSelectCurrency: OnSelectCurrency
  sections?: TokenSection[]
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
  const { t } = useTranslation()
  const sectionListRef = useRef<TokenSectionBaseListRef>()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  useEffect(() => {
    if (sections?.length) {
      sectionListRef.current?.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        animated: true,
      })
    }
  }, [chainFilter, sections?.length])

  const handleExpand = useCallback(
    (item: TokenOption | TokenOption[]) => {
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

  // Note: the typing for this comes from the web TokenSectionBaseList.tsx's renderItem
  const renderItem = useCallback(
    ({ item, section, index }: { item: TokenOption | TokenOption[]; section: TokenSection; index: number }) => {
      if (isHorizontalListTokenItem(item)) {
        return (
          <HorizontalTokenList
            tokens={item}
            section={section}
            index={index}
            expanded={isExpandedItem(item)}
            onSelectCurrency={onSelectCurrency}
            onExpand={() => handleExpand(item)}
          />
        )
      }
      return (
        <TokenOptionItemWrapper
          index={index}
          isKeyboardOpen={isKeyboardOpen}
          section={section}
          showTokenAddress={showTokenAddress}
          showWarnings={showTokenWarnings}
          tokenOption={item}
          onSelectCurrency={onSelectCurrency}
        />
      )
    },
    [onSelectCurrency, showTokenAddress, showTokenWarnings, isKeyboardOpen, handleExpand, isExpandedItem],
  )

  const renderSectionHeader = useCallback(
    ({ section }: { section: TokenSectionHeaderProps }): JSX.Element => (
      <SectionHeader
        rightElement={section.rightElement}
        endElement={section.endElement}
        sectionKey={section.sectionKey}
        name={section.name}
      />
    ),
    [],
  )

  if (hasError) {
    return (
      <>
        <Flex grow justifyContent="center">
          <BaseCard.ErrorState
            retryButtonLabel={t('common.button.retry')}
            title={errorText ?? t('tokens.selector.error.load')}
            onRetry={refetch}
          />
        </Flex>
        {/*
          This is needed to position error message roughly in the center of
          the sheet initially when modal is opened to 65% only
        */}
        <Flex grow />
      </>
    )
  }

  return (
    <AnimateTransition animationType="fade" currentIndex={(!sections || !sections.length) && loading ? 0 : 1}>
      <Flex grow px="$spacing16">
        <Flex height={ITEM_SECTION_HEADER_ROW_HEIGHT} justifyContent="center" py="$spacing16" width={80}>
          <Skeleton>
            <Loader.Box height={fonts.subheading2.lineHeight} />
          </Skeleton>
        </Flex>
        <Loader.Token gap="$none" repeat={15} />
      </Flex>
      <TokenSectionBaseList
        ListEmptyComponent={emptyElement || <EmptyResults />}
        focusHook={useBottomSheetFocusHook}
        keyExtractor={key}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sectionListRef={sectionListRef}
        sections={sections ?? []}
        expandedItems={expandedItems}
      />
    </AnimateTransition>
  )
}

function key(item: TokenOption | TokenOption[]): CurrencyId {
  if (isHorizontalListTokenItem(item)) {
    return item.map((token) => token.currencyInfo.currencyId).join('-')
  }

  return item.currencyInfo.currencyId
}

export const TokenSelectorList = memo(_TokenSelectorList)
