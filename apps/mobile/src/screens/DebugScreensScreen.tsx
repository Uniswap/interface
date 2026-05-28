import { LegendList } from '@legendapp/list'
import React, { memo, useCallback, useMemo } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Clock, Wrench } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

interface DebugScreenItem {
  id: string
  title: string
  description: string
  icon: JSX.Element
  screen: MobileScreens.HashcashBenchmark | MobileScreens.SessionsDebug
}

const ICON_SIZE = iconSizes.icon24

const DEBUG_SCREENS: DebugScreenItem[] = [
  {
    id: 'hashcash',
    title: 'Hashcash Benchmark',
    description: 'Compare native vs JS hashcash performance',
    icon: <Clock color="$neutral2" size={ICON_SIZE} />,
    screen: MobileScreens.HashcashBenchmark,
  },
  {
    id: 'sessions',
    title: 'Sessions Debug',
    description: 'Test session initialization flow',
    icon: <Wrench color="$neutral2" size={ICON_SIZE} />,
    screen: MobileScreens.SessionsDebug,
  },
]

const ESTIMATED_ITEM_SIZE = 72

interface DebugScreenRowProps {
  item: DebugScreenItem
  onPress: (screen: DebugScreenItem['screen']) => void
}

const DebugScreenRow = memo(function DebugScreenRow({ item, onPress }: DebugScreenRowProps): JSX.Element {
  const handlePress = useCallback(() => {
    onPress(item.screen)
  }, [item.screen, onPress])

  return (
    <TouchableArea onPress={handlePress}>
      <Flex
        row
        alignItems="center"
        backgroundColor="$surface2"
        borderRadius="$rounded16"
        gap="$spacing12"
        mx="$spacing16"
        p="$spacing16"
      >
        <Flex
          alignItems="center"
          backgroundColor="$surface3"
          borderRadius="$rounded12"
          height={44}
          justifyContent="center"
          width={44}
        >
          {item.icon}
        </Flex>
        <Flex flex={1} gap="$spacing4">
          <Text color="$neutral1" variant="body1">
            {item.title}
          </Text>
          <Text color="$neutral2" variant="body3">
            {item.description}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
})

function keyExtractor(item: DebugScreenItem): string {
  return item.id
}

export function DebugScreensScreen(): JSX.Element {
  const navigation = useAppStackNavigation()

  const handlePress = useCallback(
    (screen: DebugScreenItem['screen']) => {
      navigation.navigate(screen)
    },
    [navigation],
  )

  const renderItem = useCallback(
    ({ item }: { item: DebugScreenItem }) => <DebugScreenRow item={item} onPress={handlePress} />,
    [handlePress],
  )

  const data = useMemo(() => DEBUG_SCREENS, [])

  return (
    <ScreenWithHeader centerElement={<Text variant="body1">Debug Screens</Text>}>
      <LegendList
        data={data}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={contentContainerStyle}
      />
    </ScreenWithHeader>
  )
}

function ItemSeparator(): JSX.Element {
  return <Flex height="$spacing8" />
}

const contentContainerStyle = { paddingTop: 16 }
