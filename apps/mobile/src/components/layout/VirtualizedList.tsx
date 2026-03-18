import React, { ComponentProps, PropsWithChildren } from 'react'
import type { FlatListProps } from 'react-native'
import { AnimatedBottomSheetFlatList, AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'

type VirtualizedListProps = PropsWithChildren<Partial<ComponentProps<typeof AnimatedFlatList>>> & {
  renderedInModal?: boolean
}

const DATA: FlatListProps<unknown>['data'] = []
const keyExtractor = (): string => 'key'

/** Dummy component wrapping `FlatList` to behave like a ScrollView */
// biome-ignore lint/suspicious/noExplicitAny: Generic list ref type varies between FlatList and BottomSheetFlatList
export const VirtualizedList = React.forwardRef<any, VirtualizedListProps>(function _VirtualizedList(
  { children, renderedInModal, ...props }: VirtualizedListProps,
  ref,
) {
  const List = renderedInModal ? AnimatedBottomSheetFlatList : AnimatedFlatList

  return (
    <List
      {...props}
      ref={ref}
      ListHeaderComponent={<>{children}</>}
      data={DATA}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="always"
      renderItem={null}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  )
})
