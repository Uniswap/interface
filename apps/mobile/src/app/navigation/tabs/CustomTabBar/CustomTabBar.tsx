import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated'
import { TAB_BAR_ANIMATION_DURATION, TAB_ITEMS } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { SwapButton } from 'src/app/navigation/tabs/SwapButton'
import { SwapLongPressOverlay } from 'src/app/navigation/tabs/SwapLongPressOverlay'
import { Flex, TouchableArea, useIsDarkMode, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, spacing } from 'ui/src/theme'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

interface TabItemProps {
  tab: (typeof TAB_ITEMS)[number]
  index: number
  isFocused: boolean
  onPress: (index: number) => void
  colors: ReturnType<typeof useSporeColors>
}

const tabShadowOffset = { width: 0, height: 1 }
const tabBarShadowOffset = { width: 0, height: 6 }

const MARGIN = spacing.spacing4
const ANIMATED_VIEW_BORDER_WIDTH = spacing.spacing1 / 2

const TabItem = ({ tab, index, isFocused, onPress, colors }: TabItemProps): JSX.Element => {
  const IconComponent = tab.icon

  const handlePress = useEvent(() => {
    onPress(index)
  })

  return (
    <TouchableArea
      key={tab.key}
      testID={`${tab.key.toLowerCase()}-tab`}
      role="button"
      aria-label={`${tab.key} tab`}
      aria-selected={isFocused}
      flex={1}
      alignItems="center"
      justifyContent="center"
      py="$spacing18"
      borderRadius="$roundedFull"
      onPress={handlePress}
    >
      <IconComponent
        color={isFocused ? colors.neutral1.val : colors.neutral3.val}
        focused={isFocused}
        size={iconSizes.icon24}
      />
    </TouchableArea>
  )
}

export function CustomTabBar({ state, navigation }: BottomTabBarProps): JSX.Element {
  const colors = useSporeColors()
  const insets = useAppInsets()
  const { value: isSwapMenuOpen, setTrue: handleOpenSwapMenu, setFalse: handleCloseSwapMenu } = useBooleanState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const isDarkMode = useIsDarkMode()
  const { hapticFeedback } = useHapticFeedback()

  const TAB_WIDTH = containerWidth / TAB_ITEMS.length
  const ANIMATED_VIEW_WIDTH = TAB_WIDTH - MARGIN * 2 - ANIMATED_VIEW_BORDER_WIDTH * 2

  const activeTabIndex = useDerivedValue(() => {
    return withTiming(state.index, {
      duration: TAB_BAR_ANIMATION_DURATION,
    })
  })

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const translateX = TAB_WIDTH * activeTabIndex.value + MARGIN - activeTabIndex.value * ANIMATED_VIEW_BORDER_WIDTH

    return {
      transform: [{ translateX }],
    }
  })

  const onLayout = useEvent((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setContainerWidth(width)
  })

  const handleTabPress = useEvent((index: number) => {
    const route = state.routes[index]

    const event = navigation.emit({
      type: 'tabPress',
      target: route?.key ?? '',
      canPreventDefault: true,
    })

    if (!event.defaultPrevented && route) {
      navigation.navigate(route.name)
    }

    // Non-blocking haptic feedback
    hapticFeedback.light().catch(() => {
      // Silently ignore haptic feedback errors
    })
  })

  return (
    <>
      <Flex position="absolute" bottom={insets.bottom} left={0} right={0} pointerEvents="box-none">
        <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" gap="$spacing12">
          {/* Main parent container for TabItems */}
          <Flex
            row
            fill
            alignItems="center"
            backgroundColor="$surface1"
            borderRadius="$roundedFull"
            borderColor="$surface3"
            borderWidth="$spacing1"
            justifyContent="space-between"
            shadowColor="$shadowColor"
            shadowOffset={tabBarShadowOffset}
            shadowRadius={12}
            position="relative"
            onLayout={onLayout}
          >
            {/* Animated sliding background */}
            {containerWidth > 0 && (
              <Flex position="absolute" height="100%" py="$spacing4">
                <AnimatedFlex
                  height="100%"
                  width={ANIMATED_VIEW_WIDTH}
                  backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
                  borderRadius="$roundedFull"
                  borderWidth={ANIMATED_VIEW_BORDER_WIDTH}
                  borderColor="$surface3"
                  shadowColor="$shadowColor"
                  shadowOffset={tabShadowOffset}
                  shadowRadius={6}
                  shadowOpacity={0.05}
                  style={animatedBackgroundStyle}
                />
              </Flex>
            )}

            {TAB_ITEMS.map((tab, index): JSX.Element => {
              const isFocused = state.index === index

              return (
                <TabItem
                  key={tab.key}
                  tab={tab}
                  index={index}
                  isFocused={isFocused}
                  colors={colors}
                  onPress={handleTabPress}
                />
              )
            })}
          </Flex>

          <SwapButton onLongPress={handleOpenSwapMenu} />
        </Flex>
      </Flex>

      <SwapLongPressOverlay
        isVisible={isSwapMenuOpen}
        onClose={handleCloseSwapMenu}
        onSwapLongPress={handleOpenSwapMenu}
      />
    </>
  )
}
