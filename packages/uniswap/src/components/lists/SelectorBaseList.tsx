import { ContentStyle } from '@shopify/flash-list'
import { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimateTransition, Flex, Loader, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { FocusedRowControl } from 'uniswap/src/components/lists/items/OptionItem'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import {
  ItemRowInfo,
  OnchainItemList,
  OnchainItemListRef,
} from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SectionHeader, SectionHeaderProps } from 'uniswap/src/components/lists/SectionHeader'
import { ITEM_SECTION_HEADER_ROW_HEIGHT } from 'uniswap/src/components/TokenSelector/constants'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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

interface SelectorBaseListProps<T extends OnchainItemListOption> {
  sections?: OnchainItemSection<T>[]
  chainFilter?: UniverseChainId | null
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  renderItem: (info: ItemRowInfo<T>) => JSX.Element
  keyExtractor: (item: T, index: number) => string
  expandedItems?: string[]
  focusedRowControl?: Omit<FocusedRowControl, 'rowIndex'>
  renderedInModal: boolean
  contentContainerStyle?: ContentStyle
}

function _SelectorBaseList<T extends OnchainItemListOption>({
  renderItem,
  sections,
  chainFilter,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  keyExtractor,
  expandedItems,
  focusedRowControl,
  renderedInModal,
  contentContainerStyle,
}: SelectorBaseListProps<T>): JSX.Element {
  const { t } = useTranslation()
  const sectionListRef = useRef<OnchainItemListRef>(undefined)

  // biome-ignore lint/correctness/useExhaustiveDependencies: +chainFilter
  useEffect(() => {
    if (sections?.length) {
      sectionListRef.current?.scrollToLocation({
        itemIndex: 0,
        sectionIndex: 0,
        animated: true,
      })
    }
  }, [chainFilter, sections?.length])

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionHeaderProps }): JSX.Element => (
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
      <Flex grow px="$spacing20">
        <Flex height={ITEM_SECTION_HEADER_ROW_HEIGHT} justifyContent="center" py="$spacing12" width={80}>
          <Loader.Box height={fonts.subheading2.lineHeight} />
        </Flex>
        <Loader.Token gap="$none" repeat={15} />
      </Flex>
      <OnchainItemList<T>
        ListEmptyComponent={emptyElement || <EmptyResults />}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sectionListRef={sectionListRef}
        sections={sections ?? []}
        expandedItems={expandedItems}
        focusedRowControl={focusedRowControl}
        renderedInModal={renderedInModal}
        contentContainerStyle={contentContainerStyle}
      />
    </AnimateTransition>
  )
}

export const SelectorBaseList = memo(_SelectorBaseList) as typeof _SelectorBaseList
