// biome-ignore-all lint/suspicious/noExplicitAny: Generic FlatList types are complex and varied
// Adds ForwardRef to Animated.FlaList
// https://github.com/software-mansion/react-native-reanimated/issues/2976

import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { forwardRef, PropsWithChildren } from 'react'
import { FlatList, FlatListProps, LayoutChangeEvent, View } from 'react-native'
import Animated, { ILayoutAnimationBuilder } from 'react-native-reanimated'

// difficult to properly type
const ReanimatedFlatList = Animated.createAnimatedComponent(FlatList as any) as any
const ReanimatedBottomSheetFlatList = Animated.createAnimatedComponent(BottomSheetFlatList as any) as any
const AnimatedView = Animated.createAnimatedComponent(View)

const createCellRenderer = (
  itemLayoutAnimation?: ILayoutAnimationBuilder,
): React.FC<
  PropsWithChildren<{
    onLayout: (event: LayoutChangeEvent) => void
  }>
> => {
  const cellRenderer: React.FC<
    PropsWithChildren<{
      onLayout: (event: LayoutChangeEvent) => void
    }>
  > = (props) => {
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
  FlatListComponent?: FlatList
}

/**
 * re-create Reanimated FlatList but correctly pass on forwardRef in order to use scrollTo to scroll to the next page in our horizontal FlatList
 *
 * Source: https://github.com/software-mansion/react-native-reanimated/blob/main/src/reanimated2/component/FlatList.tsx
 *
 * TODO: [MOB-207] remove this and use Animated.FlatList directly when can use refs with it. Also type the generic T properly for FlatList and dont use `any`
 */
export const AnimatedFlatList = forwardRef<Animated.FlatList<any>, ReanimatedFlatlistProps<any>>(
  function _AnimatedFlatList({ itemLayoutAnimation, FlatListComponent = ReanimatedFlatList, ...restProps }, ref) {
    // biome-ignore lint/correctness/useExhaustiveDependencies: itemLayoutAnimation intentionally excluded to avoid recreation
    const cellRenderer = React.useMemo(() => createCellRenderer(itemLayoutAnimation), [])
    return <FlatListComponent ref={ref} {...restProps} CellRendererComponent={cellRenderer} />
  },
)

/**
 * In bottom sheet contexts, this will support pull to dismiss.
 * See AnimatedFlatList for other props.
 */
export const AnimatedBottomSheetFlatList = forwardRef<Animated.FlatList<any>, ReanimatedFlatlistProps<any>>(
  function _AnimatedBottomSheetFlatList(props, ref) {
    return <AnimatedFlatList {...props} ref={ref} FlatListComponent={ReanimatedBottomSheetFlatList} />
  },
)
