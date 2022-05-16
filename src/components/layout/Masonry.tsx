import React, { ReactElement } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { Box, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'

interface MasonryProps<T> {
  data: T[]
  getKey: (data: T) => string
  loading?: boolean
  renderItem: (data: T) => ReactElement
}

export function Masonry<T>({ data, getKey, loading, renderItem }: MasonryProps<T>) {
  if (loading) return <Loading repeat={2} type="box" />

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Flex row>
        <Flex flex={1} gap="sm">
          {data
            .filter((_, i) => i % 2 === 0)
            .map((d) => (
              <Box key={getKey(d)} alignItems="center">
                {renderItem(d)}
              </Box>
            ))}
        </Flex>
        <Flex flex={1} gap="sm">
          {data
            .filter((_, i) => i % 2 !== 0)
            .map((d) => (
              <Box key={getKey(d)} alignItems="center">
                {renderItem(d)}
              </Box>
            ))}
        </Flex>
      </Flex>
    </ScrollView>
  )
}
