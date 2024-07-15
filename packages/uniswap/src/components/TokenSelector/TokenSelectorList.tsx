import { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Flex, Loader, Skeleton, Text, isWeb } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { TokenOptionItem } from 'uniswap/src/components/TokenSelector/TokenOptionItem'
import {
  SectionHeaderProps,
  TokenSectionBaseList,
  TokenSectionBaseListRef,
} from 'uniswap/src/components/TokenSelector/TokenSectionBaseList'
import { renderSuggestedTokenItem } from 'uniswap/src/components/TokenSelector/renderSuggestedTokenItem'
import { suggestedTokensKeyExtractor } from 'uniswap/src/components/TokenSelector/suggestedTokensKeyExtractor'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  SuggestedTokenSection,
  TokenOption,
  TokenSection,
  TokenSelectorListSections,
  TokenWarningDismissedHook,
} from 'uniswap/src/components/TokenSelector/types'
import { useBottomSheetFocusHook } from 'uniswap/src/components/modals/hooks'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyId } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'

function isSuggestedTokenItem(data: TokenOption | TokenOption[]): data is TokenOption[] {
  return Array.isArray(data)
}

function isSuggestedTokenSection(section: SuggestedTokenSection | TokenSection): section is SuggestedTokenSection {
  return Array.isArray((section as SuggestedTokenSection).data[0])
}

function TokenOptionItemWrapper({
  tokenOption,
  onDismiss,
  onSelectCurrency,
  section,
  index,
  chainFilter,
  showWarnings,
  showTokenAddress,
  useTokenWarningDismissedHook,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
}: {
  tokenOption: TokenOption
  onSelectCurrency: OnSelectCurrency
  section: TokenSection
  index: number
  chainFilter: Maybe<UniverseChainId>
  showWarnings: boolean
  showTokenAddress?: boolean
  useTokenWarningDismissedHook: TokenWarningDismissedHook

  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  onDismiss: () => void
}): JSX.Element {
  const onPress = useCallback(
    () => onSelectCurrency(tokenOption.currencyInfo, section, index),
    [index, onSelectCurrency, section, tokenOption.currencyInfo],
  )
  const { tokenWarningDismissed, dismissWarningCallback } = useTokenWarningDismissedHook(
    tokenOption.currencyInfo.currencyId,
  )

  return (
    <TokenOptionItem
      balance={convertFiatAmountFormattedCallback(tokenOption.balanceUSD, NumberType.FiatTokenPrice)}
      dismissWarningCallback={dismissWarningCallback}
      option={tokenOption}
      quantity={tokenOption.quantity}
      quantityFormatted={formatNumberOrStringCallback({
        value: tokenOption.quantity,
        type: NumberType.TokenTx,
      })}
      showNetworkPill={!chainFilter && tokenOption.currencyInfo.currency.chainId !== UniverseChainId.Mainnet}
      showTokenAddress={showTokenAddress}
      showWarnings={showWarnings}
      tokenWarningDismissed={tokenWarningDismissed}
      onDismiss={onDismiss}
      onPress={onPress}
    />
  )
}

interface TokenSelectorListProps {
  onSelectCurrency: OnSelectCurrency
  sections?: TokenSelectorListSections
  chainFilter?: UniverseChainId | null
  showTokenWarnings: boolean
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  showTokenAddress?: boolean
  useTokenWarningDismissedHook: TokenWarningDismissedHook
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  onDismiss: () => void
}

function _TokenSelectorList({
  onSelectCurrency,
  onDismiss,
  sections,
  chainFilter,
  showTokenWarnings,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  showTokenAddress,
  useTokenWarningDismissedHook,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
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
            convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
            formatNumberOrStringCallback={formatNumberOrStringCallback}
            index={index}
            section={section}
            showTokenAddress={showTokenAddress}
            showWarnings={showTokenWarnings}
            tokenOption={item}
            useTokenWarningDismissedHook={useTokenWarningDismissedHook}
            onDismiss={onDismiss}
            onSelectCurrency={onSelectCurrency}
          />
        )
      }

      return null
    },
    [
      chainFilter,
      onSelectCurrency,
      showTokenAddress,
      showTokenWarnings,
      useTokenWarningDismissedHook,
      convertFiatAmountFormattedCallback,
      formatNumberOrStringCallback,
      onDismiss,
    ],
  )

  const renderSectionHeader = useCallback(
    ({ section: { title, rightElement } }: { section: SectionHeaderProps }): JSX.Element => (
      <SectionHeader rightElement={rightElement} title={title} />
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
    <Flex row backgroundColor="$surface1" justifyContent="space-between" pb="$spacing4" pt="$spacing12">
      <Text color="$neutral2" variant={isWeb ? 'body2' : 'subheading2'}>
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
