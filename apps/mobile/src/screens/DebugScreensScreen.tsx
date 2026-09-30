import { Flex, Text, TouchableArea, UniversalList } from '@universe/mycelium'
import React, { memo, useCallback, useMemo } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { BookOpen, Clock, TrendUp, Wrench } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

interface DebugScreenItem {
  id: string
  title: string
  description: string
  icon: JSX.Element
  screen:
    | MobileScreens.AnimatedNumberDebug
    | MobileScreens.HashcashBenchmark
    | MobileScreens.SessionsDebug
    | MobileScreens.UniversalListDebug
    | MobileScreens.Storybook
}

const ICON_SIZE = iconSizes.icon24

const STORYBOOK_ROW: DebugScreenItem = {
  id: 'storybook',
  title: 'Storybook',
  description: 'On-device component stories (mycelium migration workbench)',
  icon: <BookOpen color="$neutral2" size={ICON_SIZE} />,
  screen: MobileScreens.Storybook,
}

const DEBUG_SCREENS: DebugScreenItem[] = [
  {
    id: 'animated-number',
    title: 'Animated Number',
    description: 'Explore-style token list with fake prices that tick every 5s',
    icon: <TrendUp color="$neutral2" size={ICON_SIZE} />,
    screen: MobileScreens.AnimatedNumberDebug,
  },
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
  {
    id: 'universal-list',
    title: 'Universal List',
    description: 'Legend List via UniversalList (native)',
    icon: <Wrench color="$neutral2" size={ICON_SIZE} />,
    screen: MobileScreens.UniversalListDebug,
  },
  // Storybook is registered in navigation.tsx under __DEV__ (or in the device-farm storybook
  // artifacts, which boot into it directly and never reach this screen), so gate the row on
  // __DEV__: this screen is isDevEnv()-gated, and in a dev-flavor release build the tap would
  // be a silent no-op.
  ...(__DEV__ ? [STORYBOOK_ROW] : []),
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
      <UniversalList
        contentContainerStyle={{ className: 'pt-4' }}
        data={data}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </ScreenWithHeader>
  )
}

function ItemSeparator(): JSX.Element {
  return <Flex height="$spacing8" />
}
