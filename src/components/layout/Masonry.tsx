import React, { ReactElement } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'

interface MasonryProps<T> {
  data: T[]
  getKey: (data: T) => string
  loading?: boolean
  renderItem: (data: T) => ReactElement
  width?: number
}

export function Masonry<T>({ data, getKey, loading, renderItem }: MasonryProps<T>) {
  const theme = useAppTheme()

  if (loading)
    return (
      <Flex row gap="xxs" padding="xxs">
        <Loading repeat={2} type="box" />
        <Loading repeat={2} type="box" />
      </Flex>
    )

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: theme.spacing.xxs }}
      showsVerticalScrollIndicator={false}>
      <Flex row gap="none" px="xs">
        <Flex flex={1} gap="sm" padding="xxs">
          {data
            .filter((_, i) => i % 2 === 0)
            .map((d) => (
              <Box key={getKey(d)} alignItems="center">
                {renderItem(d)}
              </Box>
            ))}
        </Flex>
        <Flex flex={1} gap="sm" padding="xxs">
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
