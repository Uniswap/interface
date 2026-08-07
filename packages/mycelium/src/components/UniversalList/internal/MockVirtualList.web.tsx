import { Fragment, type ReactElement } from 'react'
import { Flex } from '../../flex'
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
    <Flex direction="column" className={style?.className}>
      <Flex direction="column" className={contentContainerStyle?.className}>
        {ListHeaderComponent}
        {data.length === 0
          ? ListEmptyComponent
          : data.map((item, index) => (
              <Fragment key={keyExtractor(item, index)}>{renderItem({ item, index })}</Fragment>
            ))}
        {ListFooterComponent}
      </Flex>
    </Flex>
  )
}
