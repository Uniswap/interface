import { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex, Flex, isWeb, Loader, Skeleton, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { useBottomSheetFocusHook } from 'wallet/src/components/modals/hooks'
import { renderSuggestedTokenItem } from 'wallet/src/components/TokenSelector/renderSuggestedTokenItem'
import { suggestedTokensKeyExtractor } from 'wallet/src/components/TokenSelector/suggestedTokensKeyExtractor'
import { TokenOptionItem } from 'wallet/src/components/TokenSelector/TokenOptionItem'
import {
  SectionHeaderProps,
  TokenSectionBaseList,
  TokenSectionBaseListRef,
} from 'wallet/src/components/TokenSelector/TokenSectionBaseList'
import {
  OnSelectCurrency,
  SuggestedTokenSection,
  TokenOption,
  TokenSection,
  TokenSelectorListSections,
} from 'wallet/src/components/TokenSelector/types'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyId } from 'wallet/src/utils/currencyId'

function isSuggestedTokenItem(data: TokenOption | TokenOption[]): data is TokenOption[] {
  return Array.isArray(data)
}

function isSuggestedTokenSection(
  section: SuggestedTokenSection | TokenSection
): section is SuggestedTokenSection {
  return Array.isArray((section as SuggestedTokenSection).data[0])
}

function TokenOptionItemWrapper({
  tokenOption,
  onSelectCurrency,
  section,
  index,
  chainFilter,
  showWarnings,
  showTokenAddress,
}: {
  tokenOption: TokenOption
  onSelectCurrency: OnSelectCurrency
  section: TokenSection
  index: number
  chainFilter: Maybe<ChainId>
  showWarnings: boolean
  showTokenAddress?: boolean
}): JSX.Element {
  const onPress = useCallback(
    () => onSelectCurrency(tokenOption.currencyInfo, section, index),
    [index, onSelectCurrency, section, tokenOption.currencyInfo]
  )

  return (
    <TokenOptionItem
      option={tokenOption}
      showNetworkPill={
        !chainFilter && tokenOption.currencyInfo.currency.chainId !== ChainId.Mainnet
      }
      showTokenAddress={showTokenAddress}
      showWarnings={showWarnings}
      onPress={onPress}
    />
  )
}

interface TokenSelectorListProps {
  onSelectCurrency: OnSelectCurrency
  sections?: TokenSelectorListSections
  chainFilter?: ChainId | null
  showTokenWarnings: boolean
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  showTokenAddress?: boolean
}

function _TokenSelectorList({
  onSelectCurrency,
  sections,
  chainFilter,
  showTokenWarnings,
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
    ({
      item,
      section,
      index,
    }: {
      item: TokenOption | TokenOption[]
      section: SuggestedTokenSection | TokenSection
      index: number
    }) => {
      if (isSuggestedTokenItem(item) && isSuggestedTokenSection(section)) {
        return renderSuggestedTokenItem({ item, section, index, onSelectCurrency })
      }

      if (!isSuggestedTokenItem(item) && !isSuggestedTokenSection(section)) {
        return (
          <TokenOptionItemWrapper
            chainFilter={chainFilter}
            index={index}
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
    [chainFilter, onSelectCurrency, showTokenAddress, showTokenWarnings]
  )

  const renderSectionHeader = useCallback(
    ({ section: { title, rightElement } }: { section: SectionHeaderProps }): JSX.Element => (
      <SectionHeader rightElement={rightElement} title={title} />
    ),
    []
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

  if (loading) {
    return (
      <Flex grow>
        <Flex py="$spacing16" width={80}>
          <Skeleton>
            <Loader.Box height={fonts.subheading2.lineHeight} />
          </Skeleton>
        </Flex>
        <Loader.Token repeat={5} />
      </Flex>
    )
  }

  return (
    // TODO(EXT-526): re-enable `exiting` animation when it's fixed.
    <AnimatedFlex grow entering={FadeIn} exiting={isWeb ? undefined : FadeOut}>
      <TokenSectionBaseList
        ListEmptyComponent={emptyElement}
        focusHook={useBottomSheetFocusHook}
        keyExtractor={key}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sectionListRef={sectionListRef}
        sections={sections ?? []}
      />
    </AnimatedFlex>
  )
}

export function SectionHeader({ title, rightElement }: SectionHeaderProps): JSX.Element {
  return (
    <Flex
      row
      backgroundColor="$surface1"
      justifyContent="space-between"
      pb="$spacing4"
      pt="$spacing12">
      <Text color="$neutral2" variant="subheading2">
        {title}
      </Text>
      {rightElement}
    </Flex>
  )
}

function key(item: TokenOption | TokenOption[]): CurrencyId {
  if (isSuggestedTokenItem(item)) {
    return suggestedTokensKeyExtractor(item)
  }

  return item.currencyInfo.currencyId
}

export const TokenSelectorList = memo(_TokenSelectorList)
