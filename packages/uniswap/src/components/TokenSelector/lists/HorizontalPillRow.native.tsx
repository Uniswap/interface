import { ReactElement } from 'react'
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
}

/** Horizontally-scrolling pill row shared by the native token-selector sections. */
export function HorizontalPillRow<T>({ data, keyExtractor, renderPill }: HorizontalPillRowProps<T>): JSX.Element {
  // Keep the data reference stable while the items are unchanged, so a new array with the
  // same items doesn't re-render the list.
  const stableData = useMemoCompare(
    () => data,
    (previous, next) => areListsEqualByKey({ previous, next, keyExtractor }),
  )
  const renderItem = useEvent(({ item }: { item: T }) => renderPill(item))

  return (
    <FlatList
      horizontal
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      data={stableData}
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
