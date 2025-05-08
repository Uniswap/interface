import { FlashList } from '@shopify/flash-list'
import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { AnimatedBottomSheetFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { TokenSectionBaseListProps } from 'uniswap/src/components/lists/TokenSectionBaseList/TokenSectionBaseList'
import {
  ProcessedRow,
  ProcessedRowType,
  processTokenSections,
} from 'uniswap/src/components/lists/TokenSectionBaseList/processTokenSections'
import { ItemType } from 'uniswap/src/components/lists/types'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

const TOKEN_ITEM_SIZE = 68
const AMOUNT_TO_DRAW = 18

export const TokenSectionBaseList = memo(function TokenSectionBaseList({
  sectionListRef,
  ListEmptyComponent,
  keyExtractor,
  renderItem,
  renderSectionHeader,
  sections,
}: TokenSectionBaseListProps<ItemType>): JSX.Element {
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
        case ProcessedRowType.Item:
          return renderItem(item.data)
        default:
          return null
      }
    },
    [renderItem, renderSectionHeader],
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
