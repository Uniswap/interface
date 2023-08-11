import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { Currency } from '@uniswap/sdk-core'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex, Inset } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { useBottomSheetFocusHook } from 'src/components/modals/hooks'
import { Text } from 'src/components/Text'
import { TokenOptionItem } from 'src/components/TokenSelector/TokenOptionItem'
import {
  renderSuggestedTokenItem,
  suggestedTokensKeyExtractor,
} from 'src/components/TokenSelector/TokenSelectorSwapOutputList'
import { TokenOption } from 'src/components/TokenSelector/types'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyId } from 'wallet/src/utils/currencyId'

export type OnSelectCurrency = (
  currency: Currency,
  section: SuggestedTokenSection | TokenSection,
  index: number
) => void

export type TokenSection = {
  title: string
  data: TokenOption[]
}

export type SuggestedTokenSection = {
  title: string
  data: TokenOption[][]
}

export type TokenSelectorListSections = Array<SuggestedTokenSection | TokenSection>

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
}: {
  tokenOption: TokenOption
  onSelectCurrency: OnSelectCurrency
  section: TokenSection
  index: number
  chainFilter: ChainId | null
  showWarnings: boolean
}): JSX.Element {
  const onPress = useCallback(
    () => onSelectCurrency(tokenOption.currencyInfo.currency, section, index),
    [index, onSelectCurrency, section, tokenOption.currencyInfo.currency]
  )

  return (
    <TokenOptionItem
      option={tokenOption}
      showNetworkPill={
        !chainFilter && tokenOption.currencyInfo.currency.chainId !== ChainId.Mainnet
      }
      showWarnings={showWarnings}
      onPress={onPress}
    />
  )
}

function Footer(): JSX.Element {
  return <Inset all="spacing36" />
}

interface TokenSelectorListProps {
  onSelectCurrency: OnSelectCurrency
  sections?: TokenSelectorListSections
  chainFilter: ChainId | null
  showTokenWarnings: boolean
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
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
}: TokenSelectorListProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const sectionListRef = useRef<SectionList<TokenOption>>(null)

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
            showWarnings={showTokenWarnings}
            tokenOption={item}
            onSelectCurrency={onSelectCurrency}
          />
        )
      }

      return null
    },
    [chainFilter, onSelectCurrency, showTokenWarnings]
  )

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }): JSX.Element => (
      <SectionHeader title={title} />
    ),
    []
  )

  if (hasError) {
    return (
      <>
        <Box flexGrow={1} justifyContent="center">
          <BaseCard.ErrorState
            retryButtonLabel={t('Retry')}
            title={errorText ?? t("Couldn't load tokens")}
            onRetry={refetch}
          />
        </Box>
        {/*
          This is needed to position error message roughly in the center of
          the sheet initially when modal is opened to 65% only
        */}
        <Box flexGrow={1} />
      </>
    )
  }

  if (loading) {
    return (
      <Box>
        <Box py="spacing16" width={80}>
          <Loader.Box height={theme.textVariants.subheadSmall.lineHeight} />
        </Box>
        <Loader.Token repeat={5} />
      </Box>
    )
  }

  return (
    <Box flexGrow={1}>
      <BottomSheetSectionList<TokenOption | TokenOption[], SuggestedTokenSection | TokenSection>
        ref={sectionListRef}
        ListEmptyComponent={emptyElement}
        ListFooterComponent={Footer}
        bounces={false}
        focusHook={useBottomSheetFocusHook}
        keyExtractor={key}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sections={sections ?? []}
        showsVerticalScrollIndicator={false}
        windowSize={4}
      />
    </Box>
  )
}

export function SectionHeader({ title }: { title: string }): JSX.Element {
  return (
    <Flex backgroundColor="surface1" py="spacing16">
      <Text color="neutral2" variant="subheadSmall">
        {title}
      </Text>
    </Flex>
  )
}

function key(item: TokenOption | TokenOption[]): CurrencyId {
  if (isSuggestedTokenItem(item)) return suggestedTokensKeyExtractor(item)

  return item.currencyInfo.currencyId
}

export const TokenSelectorList = memo(_TokenSelectorList)
