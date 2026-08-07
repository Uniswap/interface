import { Fragment, type ReactElement } from 'react'
import { View } from 'react-native'
import type { UniversalListProps } from '../types'

// Non-virtualized placeholder used until the real Legend List engine lands.
export function MockVirtualList<T>({
  contentContainerStyle,
  data,
  keyExtractor,
  ListEmptyComponent,
  ListFooterComponent,
  ListHeaderComponent,
  renderItem,
  style,
}: UniversalListProps<T>): ReactElement {
  return (
    <View className={style?.className}>
      <View className={contentContainerStyle?.className}>
        {ListHeaderComponent}
        {data.length === 0
          ? ListEmptyComponent
          : data.map((item, index) => (
              <Fragment key={keyExtractor(item, index)}>{renderItem({ item, index })}</Fragment>
            ))}
        {ListFooterComponent}
      </View>
    </View>
  )
}
