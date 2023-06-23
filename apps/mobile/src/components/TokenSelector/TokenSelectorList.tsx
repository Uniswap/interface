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
import { TokenOption } from 'src/components/TokenSelector/types'
import { ChainId } from 'wallet/src/constants/chains'
import { EMPTY_ARRAY } from 'wallet/src/constants/misc'
import { CurrencyId } from 'wallet/src/utils/currencyId'

export type OnSelectCurrency = (currency: Currency, section: TokenSection, index: number) => void

export type TokenSection = {
  title: string
  data: TokenOption[]
}

export type SuggestedTokenSection = Omit<TokenSection, 'data'> & {
  data: TokenOption[][]
}

export type TokenSelectorListSections = Array<SuggestedTokenSection | TokenSection>

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
    () => onSelectCurrency?.(tokenOption.currencyInfo.currency, section, index),
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
  showTokenWarnings?: boolean
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
    ({ item, section, index }: { item: TokenOption; section: TokenSection; index: number }) => {
      return (
        <TokenOptionItemWrapper
          chainFilter={chainFilter}
          index={index}
          section={section}
          showWarnings={Boolean(showTokenWarnings)}
          tokenOption={item}
          onSelectCurrency={onSelectCurrency}
        />
      )
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
      <BottomSheetSectionList
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
        sections={sections ?? EMPTY_ARRAY}
        showsVerticalScrollIndicator={false}
        windowSize={4}
      />
    </Box>
  )
}

export function SectionHeader({ title }: { title: string }): JSX.Element {
  return (
    <Flex backgroundColor="background1" py="spacing16">
      <Text color="textSecondary" variant="subheadSmall">
        {title}
      </Text>
    </Flex>
  )
}

function key(item: TokenOption): CurrencyId {
  return item.currencyInfo.currencyId
}

export const TokenSelectorList = memo(_TokenSelectorList)
