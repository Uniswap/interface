import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { FlashList } from '@shopify/flash-list'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { SectionList } from 'react-native'
import { AnimatedBottomSheetFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { TokenSectionBaseListProps } from 'uniswap/src/components/TokenSelector/lists/TokenSectionBaseList/TokenSectionBaseList'
import {
  ProcessedRow,
  ProcessedRowType,
  processTokenSections,
} from 'uniswap/src/components/TokenSelector/lists/TokenSectionBaseList/processTokenSections'
import type { TokenOption, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

export function TokenSectionBaseList(props: TokenSectionBaseListProps): JSX.Element {
  const flashListEnabled = useFeatureFlag(FeatureFlags.TokenSelectorFlashList)
  if (flashListEnabled) {
    return <TokenSectionBaseListFlashList {...props} />
  }
  return <TokenSectionBaseListOriginal {...props} />
}

const TOKEN_ITEM_SIZE = 68
const AMOUNT_TO_DRAW = 18

const TokenSectionBaseListFlashList = memo(function TokenSectionBaseListFlashList({
  sectionListRef,
  ListEmptyComponent,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  renderSectionFooter,
  sections,
}: TokenSectionBaseListProps): JSX.Element {
  const insets = useAppInsets()
  const ref = useRef<FlashList<ProcessedRow>>(null)

  useEffect(() => {
    if (sectionListRef) {
      sectionListRef.current = {
        scrollToLocation: ({ itemIndex, sectionIndex, animated }): void => {
          ref.current?.scrollToIndex({ index: itemIndex || sectionIndex, animated })
        },
      }
    }
  }, [sectionListRef])

  const data = useMemo(() => {
    return processTokenSections(sections)
  }, [sections])

  // TODO(WALL-5889): fix sticky header indices (prevent duplicates)
  // const stickyHeaderIndices: number[] = useMemo(() => {
  //   return data
  //     .map((row, index) => (row.type === ProcessedRowType.Header ? index : null))
  //     .filter((index) => index !== null) as number[]
  // }, [data])

  const renderFlashListItem = useCallback(
    ({ item }: { item: ProcessedRow }) => {
      switch (item.type) {
        case ProcessedRowType.Header:
          return renderSectionHeader?.(item.data) ?? null
        case ProcessedRowType.Footer:
          return renderSectionFooter?.(item.data) ?? null
        case ProcessedRowType.Item:
          return renderItem(item.data)
        default:
          return null
      }
    },
    [renderItem, renderSectionHeader, renderSectionFooter],
  )

  const getItemType = useCallback((item: ProcessedRow): string => item.type, [])

  const makeKey = useCallback(
    (item: ProcessedRow, index: number): string => {
      if (!keyExtractor) {
        return String(index)
      }
      switch (item.type) {
        case ProcessedRowType.Header:
          return `${item.data.section.sectionKey}-header-${index}`
        case ProcessedRowType.Item:
          return `${keyExtractor(item.data.item, index)}-${index}`
        case ProcessedRowType.Footer:
          return `${item.data.section.sectionKey}-footer-${index}`
        default:
          return ''
      }
    },
    [keyExtractor],
  )
  return (
    <AnimatedBottomSheetFlashList
      ref={ref}
      data={data}
      ListEmptyComponent={ListEmptyComponent}
      estimatedItemSize={TOKEN_ITEM_SIZE}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      keyExtractor={makeKey}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
      renderItem={renderFlashListItem}
      getItemType={getItemType}
      showsVerticalScrollIndicator={false}
      drawDistance={TOKEN_ITEM_SIZE * AMOUNT_TO_DRAW}
      // TODO(WALL-5889): fix sticky header indices (prevent duplicates)
      // stickyHeaderIndices={stickyHeaderIndices}
    />
  )
})

function TokenSectionBaseListOriginal({
  sectionListRef,
  ListEmptyComponent,
  focusHook,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  renderSectionFooter,
  sections,
}: TokenSectionBaseListProps): JSX.Element {
  const insets = useAppInsets()
  const ref = useRef<SectionList<TokenOption>>(null)

  useEffect(() => {
    if (sectionListRef) {
      sectionListRef.current = {
        scrollToLocation: ({ itemIndex, sectionIndex, animated }): void => {
          ref.current?.scrollToLocation({ itemIndex, sectionIndex, animated })
        },
      }
    }
  }, [sectionListRef])

  return (
    <BottomSheetSectionList<TokenOption | TokenOption[], TokenSection>
      ref={ref}
      ListEmptyComponent={ListEmptyComponent}
      bounces={true}
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      focusHook={focusHook}
      keyExtractor={keyExtractor}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
      renderItem={renderItem}
      renderSectionFooter={renderSectionFooter}
      renderSectionHeader={renderSectionHeader}
      sections={sections ?? []}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={true}
      windowSize={4}
    />
  )
}
