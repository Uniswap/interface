// Adds ForwardRef to Animated.FlaList
// https://github.com/software-mansion/react-native-reanimated/issues/2976

import React, { forwardRef } from 'react'
import { FlatList, FlatListProps, LayoutChangeEvent, View } from 'react-native'
import Animated, { ILayoutAnimationBuilder } from 'react-native-reanimated'

// difficult to properly type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReanimatedFlatList = Animated.createAnimatedComponent(FlatList as any) as any
const AnimatedView = Animated.createAnimatedComponent(View)

const createCellRenderer = (itemLayoutAnimation?: ILayoutAnimationBuilder) => {
  const cellRenderer: React.FC<{
    onLayout: (event: LayoutChangeEvent) => void
  }> = (props) => {
    return (
      <AnimatedView layout={itemLayoutAnimation as never} onLayout={props.onLayout}>
        {props.children}
      </AnimatedView>
    )
  }

  return cellRenderer
}

interface ReanimatedFlatlistProps<T> extends FlatListProps<T> {
  itemLayoutAnimation?: ILayoutAnimationBuilder
}

/**
 * re-create Reanimated FlatList but correctly pass on forwardRef in order to use scrollTo to scroll to the next page in our horizontal FlatList
 *
 * Source: https://github.com/software-mansion/react-native-reanimated/blob/main/src/reanimated2/component/FlatList.tsx
 *
 * TODO: [MOB-3870] remove this and use Animated.FlatList directly when can use refs with it. Also type the generic T properly for FlatList and dont use `any`
 */
// difficult to properly type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AnimatedFlatList = forwardRef<Animated.FlatList<any>, ReanimatedFlatlistProps<any>>(
  ({ itemLayoutAnimation, ...restProps }, ref) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const cellRenderer = React.useMemo(() => createCellRenderer(itemLayoutAnimation), [])
    return <ReanimatedFlatList ref={ref} {...restProps} CellRendererComponent={cellRenderer} />
  }
)
