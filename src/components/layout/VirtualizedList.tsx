import React, { PropsWithChildren } from 'react'
import { FlatList } from 'react-native'

/** Dummy component wrapping `FlatList` to behave like a ScrollView */
export const VirtualizedList = ({ children }: PropsWithChildren<{}>) => {
  return (
    <FlatList
      ListHeaderComponent={<>{children}</>}
      data={[]}
      keyExtractor={() => 'key'}
      renderItem={null}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  )
}
