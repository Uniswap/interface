import { useScrollToTop } from '@react-navigation/native'
import React, { ReactElement, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { Extrapolate, interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { BackButton } from 'src/components/buttons/BackButton'
import { WithScrollToTop } from 'src/components/layout/screens/WithScrollToTop'
import { ColorTokens, Flex } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

type ScrollHeaderProps = {
  scrollY: SharedValue<number>
  showHeaderScrollYDistance: number
  // hard to type
  // biome-ignore lint/suspicious/noExplicitAny: Ref type varies based on list component used
  listRef: React.MutableRefObject<any>
  centerElement?: JSX.Element
  rightElement?: JSX.Element
  alwaysShowCenterElement?: boolean
  fullScreen?: boolean // Expand to device edges
  backgroundColor?: ColorTokens
  backButtonColor?: ColorTokens
}

/**
 * Fixed header that will fade in on scroll. Define values in parent, to be used by some
 * relevant list component.
 *
 * Used to achieve functionality of HeaderScrollScreen, but can be used in any context. One
 * example is using a scrolled above a full screen view like NFTCollectionScreen.
 */
export function ScrollHeader({
  listRef,
  scrollY,
  showHeaderScrollYDistance,
  centerElement,
  rightElement = <Flex width={iconSizes.icon24} />,
  alwaysShowCenterElement,
  fullScreen = false,
  backgroundColor,
  backButtonColor,
}: ScrollHeaderProps): JSX.Element {
  // scrolls to top when tapping on the active tab
  useScrollToTop(listRef)

  const visibleOnScrollStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, showHeaderScrollYDistance], [0, 1], Extrapolate.CLAMP),
    }
  })

  const insets = useAppInsets()
  const headerRowStyles = useMemo(() => {
    return fullScreen
      ? {
          paddingTop: insets.top,
        }
      : { paddingTop: 0 }
  }, [fullScreen, insets.top])

  const headerWrapperStyles = fullScreen ? [visibleOnScrollStyle, { zIndex: zIndexes.popover }] : []

  return (
    <HeaderWrapper backgroundColor={backgroundColor} fullScreen={fullScreen} style={headerWrapperStyles}>
      <WithScrollToTop ref={listRef}>
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          mx="$spacing16"
          my="$spacing12"
          style={headerRowStyles}
        >
          <BackButton color={backButtonColor} />
          <Flex shrink gap="$spacing16">
            {alwaysShowCenterElement ? (
              centerElement
            ) : (
              <AnimatedFlex style={visibleOnScrollStyle}>{centerElement}</AnimatedFlex>
            )}
          </Flex>
          {rightElement}
        </Flex>
        <AnimatedFlex
          borderBottomColor={backgroundColor ?? '$surface3'}
          borderBottomWidth={0.25}
          height={1}
          overflow="visible"
          style={visibleOnScrollStyle}
        />
      </WithScrollToTop>
    </HeaderWrapper>
  )
}

// If full screen, extend content to edge of device screen with an absolute position.
function HeaderWrapper({
  fullScreen,
  children,
  style,
  backgroundColor = '$surface1',
}: {
  fullScreen: boolean
  children: ReactElement
  style?: StyleProp<Animated.AnimateStyle<StyleProp<ViewStyle>>>
  backgroundColor?: ColorTokens
}): JSX.Element {
  if (!fullScreen) {
    return <Flex backgroundColor={backgroundColor}>{children}</Flex>
  }
  return (
    <AnimatedFlex
      backgroundColor={backgroundColor}
      left={0}
      opacity={0}
      position="absolute"
      right={0}
      style={style}
      top={0}
    >
      {children}
    </AnimatedFlex>
  )
}
