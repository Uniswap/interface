import React, { ComponentProps, PropsWithChildren } from 'react'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'

type VirtualizedListProps = PropsWithChildren<Partial<ComponentProps<typeof AnimatedFlatList>>>

/** Dummy component wrapping `FlatList` to behave like a ScrollView */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const VirtualizedList = React.forwardRef<any, VirtualizedListProps>(
  ({ children, ...props }: VirtualizedListProps, ref) => (
    <AnimatedFlatList
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
)
