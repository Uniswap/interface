import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useCallback, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import {
  BOTTOM_TABS_HEIGHT,
  TAB_BAR_ANIMATION_DURATION,
  TAB_ITEMS,
} from 'src/app/navigation/tabs/CustomTabBar/constants'
import { SwapButton } from 'src/app/navigation/tabs/SwapButton'
import { SwapLongPressModal } from 'src/app/navigation/tabs/SwapLongPressModal'
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

const TabItem = ({ tab, index, isFocused, onPress, colors }: TabItemProps): JSX.Element => {
  const IconComponent = tab.icon

  const handlePress = useEvent(() => {
    onPress(index)
  })

  return (
    <TouchableArea
      key={tab.key}
      role="button"
      aria-label={`${tab.key} tab`}
      aria-selected={isFocused}
      flex={1}
      alignItems="center"
      justifyContent="center"
      px="$spacing24"
      py="$spacing8"
      borderRadius="$roundedFull"
      onPressIn={handlePress}
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

  // Animated style for the sliding background
  const activeTabIndex = useSharedValue(state.index)
  const tabWidth = useSharedValue(0)
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundLeft = activeTabIndex.value * tabWidth.value + spacing.spacing8

    return {
      transform: [{ translateX: backgroundLeft }],
    }
  })

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout
      const adjustedWidth = width - spacing.spacing8
      setContainerWidth(adjustedWidth)
      tabWidth.value = adjustedWidth / TAB_ITEMS.length
    },
    [tabWidth],
  )

  const handleTabPress = useEvent((index: number) => {
    const route = state.routes[index]

    activeTabIndex.value = withTiming(index, {
      duration: TAB_BAR_ANIMATION_DURATION,
    })

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
      <Flex
        position="absolute"
        bottom={insets.bottom}
        left={0}
        right={0}
        pointerEvents="box-none"
        height={BOTTOM_TABS_HEIGHT}
      >
        <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" gap="$spacing12">
          <Flex
            row
            fill
            alignItems="center"
            px="$spacing4"
            py="$spacing8"
            backgroundColor={isDarkMode ? '$surface1' : '$surface2'}
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
              <AnimatedFlex
                position="absolute"
                top={spacing.spacing4}
                bottom={spacing.spacing4}
                width={containerWidth / TAB_ITEMS.length - spacing.spacing8} // Subtract margin for both sides
                backgroundColor={isDarkMode ? '$surface2' : '$surface1'}
                borderRadius="$roundedFull"
                borderWidth="$spacing1"
                borderColor="$surface3"
                shadowColor="$shadowColor"
                shadowOffset={tabShadowOffset}
                shadowRadius={6}
                shadowOpacity={0.05}
                style={animatedBackgroundStyle}
              />
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

      <SwapLongPressModal
        isVisible={isSwapMenuOpen}
        onClose={handleCloseSwapMenu}
        onSwapLongPress={handleOpenSwapMenu}
      />
    </>
  )
}
