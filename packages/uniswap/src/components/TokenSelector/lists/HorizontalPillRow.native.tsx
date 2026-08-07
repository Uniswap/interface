import { ReactElement, useMemo } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { useEvent, useMemoCompare } from 'utilities/src/react/hooks'

const CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: spacing.spacing16,
  paddingVertical: spacing.spacing4,
}

type HorizontalPillRowProps<T> = {
  data: T[]
  keyExtractor: (item: T) => string
  renderPill: (item: T) => ReactElement
  /** Pass any external value `renderPill` reads; pills re-render only when an item or this value changes. */
  extraData?: unknown
}

/** Horizontally-scrolling pill row shared by the native token-selector sections. */
export function HorizontalPillRow<T>({
  data,
  keyExtractor,
  renderPill,
  extraData,
}: HorizontalPillRowProps<T>): JSX.Element {
  // Keep the data reference stable while the items are unchanged, so a new array with the
  // same items doesn't re-render the list.
  const stableData = useMemoCompare(
    () => data,
    (previous, next) => areListsEqualByKey({ previous, next, keyExtractor }),
  )
  const stableRenderPill = useEvent(renderPill)
  // RN's CellRenderer is pure on `item`/`renderItem` identity, so a stable renderItem freezes the cells entirely.
  // Mint a new identity when extraData changes to invalidate them (memoized pills still bail individually).
  const renderItem = useMemo(
    () =>
      ({ item }: { item: T }): ReactElement =>
        stableRenderPill(item),
    // oxlint-disable-next-line react/exhaustive-deps -- extraData is an intentional cache-buster
    [extraData, stableRenderPill],
  )

  return (
    <FlatList
      horizontal
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      data={stableData}
      extraData={extraData}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparatorComponent}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
    />
  )
}

function ItemSeparatorComponent(): JSX.Element {
  return <Flex width="$spacing8" />
}

function areListsEqualByKey<T>(input: {
  previous: T[] | undefined
  next: T[]
  keyExtractor: (item: T) => string
}): boolean {
  const { previous, next, keyExtractor } = input
  return Boolean(
    previous?.length === next.length &&
    previous.every((item, index) => {
      const other = next[index]
      return other !== undefined && keyExtractor(item) === keyExtractor(other)
    }),
  )
}
