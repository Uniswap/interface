import { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimateTransition, Flex, Loader, Skeleton, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { TokenOptionItem } from 'uniswap/src/components/TokenSelector/TokenOptionItem'
import {
  TokenSectionBaseList,
  TokenSectionBaseListRef,
} from 'uniswap/src/components/TokenSelector/TokenSectionBaseList'
import { ITEM_SECTION_HEADER_ROW_HEIGHT } from 'uniswap/src/components/TokenSelector/TokenSectionBaseList.web'
import { SectionHeader, TokenSectionHeaderProps } from 'uniswap/src/components/TokenSelector/TokenSectionHeader'
import { renderSuggestedTokenItem } from 'uniswap/src/components/TokenSelector/renderSuggestedTokenItem'
import { suggestedTokensKeyExtractor } from 'uniswap/src/components/TokenSelector/suggestedTokensKeyExtractor'
import {
  OnSelectCurrency,
  TokenOption,
  TokenOptionSection,
  TokenSection,
} from 'uniswap/src/components/TokenSelector/types'
import { useBottomSheetFocusHook } from 'uniswap/src/components/modals/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyId } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'

function isSuggestedTokenItem(data: TokenOption | TokenOption[]): data is TokenOption[] {
  return Array.isArray(data)
}

export function isSuggestedTokenSection(section: TokenSection): boolean {
  return section.sectionKey === TokenOptionSection.SuggestedTokens
}

function TokenOptionItemWrapper({
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

  const { tokenWarningDismissed, onDismissTokenWarning: dismissWarningCallback } = useDismissedTokenWarnings(
    tokenOption.currencyInfo.currency,
  )

  return (
    <TokenOptionItem
      balance={convertFiatAmountFormatted(tokenOption.balanceUSD, NumberType.FiatTokenPrice)}
      dismissWarningCallback={dismissWarningCallback}
      isKeyboardOpen={isKeyboardOpen}
      option={tokenOption}
      quantity={tokenOption.quantity}
      quantityFormatted={formatNumberOrString({
        value: tokenOption.quantity,
        type: NumberType.TokenTx,
      })}
      showTokenAddress={showTokenAddress}
      showWarnings={showWarnings}
      tokenWarningDismissed={tokenWarningDismissed}
      onPress={onPress}
    />
  )
}

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

  useEffect(() => {
    if (sections?.length) {
      sectionListRef.current?.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        animated: true,
      })
    }
  }, [chainFilter, sections?.length])

  const renderItem = useCallback(
    ({ item, section, index }: { item: TokenOption | TokenOption[]; section: TokenSection; index: number }) => {
      if (isSuggestedTokenItem(item) && isSuggestedTokenSection(section)) {
        return renderSuggestedTokenItem({ item, section, index, onSelectCurrency })
      }

      if (!isSuggestedTokenItem(item) && !isSuggestedTokenSection(section)) {
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
      }

      return null
    },
    [onSelectCurrency, showTokenAddress, showTokenWarnings, isKeyboardOpen],
  )

  const renderSectionHeader = useCallback(
    ({ section }: { section: TokenSectionHeaderProps }): JSX.Element => (
      <SectionHeader rightElement={section.rightElement} sectionKey={section.sectionKey} />
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
      />
    </AnimateTransition>
  )
}

function key(item: TokenOption | TokenOption[]): CurrencyId {
  if (isSuggestedTokenItem(item)) {
    return suggestedTokensKeyExtractor(item)
  }

  return item.currencyInfo.currencyId
}

export const TokenSelectorList = memo(_TokenSelectorList)
