import React, { ComponentProps, PropsWithChildren } from 'react'
import {
  AnimatedBottomSheetFlatList,
  AnimatedFlatList,
} from 'src/components/layout/AnimatedFlatList'

type VirtualizedListProps = PropsWithChildren<Partial<ComponentProps<typeof AnimatedFlatList>>> & {
  renderedInModal?: boolean
}

/** Dummy component wrapping `FlatList` to behave like a ScrollView */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const VirtualizedList = React.forwardRef<any, VirtualizedListProps>(
  function _VirtualizedList({ children, renderedInModal, ...props }: VirtualizedListProps, ref) {
    const List = renderedInModal ? AnimatedBottomSheetFlatList : AnimatedFlatList
    return (
      <List
        sentry-label="VirtualizedList"
        {...props}
        ref={ref}
        ListHeaderComponent={<>{children}</>}
        data={[]}
        keyExtractor={(): string => 'key'}
        keyboardShouldPersistTaps="always"
        renderItem={null}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    )
  }
)
