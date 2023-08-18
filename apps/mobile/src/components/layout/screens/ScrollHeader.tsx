import { useScrollToTop } from '@react-navigation/native'
import React, { ReactElement, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackButton } from 'src/components/buttons/BackButton'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { WithScrollToTop } from 'src/components/layout/screens/WithScrollToTop'
import { zIndices } from 'ui/src/theme'
import { Theme, theme } from 'ui/src/theme/restyle'

type ScrollHeaderProps = {
  scrollY: SharedValue<number>
  showHeaderScrollYDistance: number
  // hard to type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listRef: React.MutableRefObject<any>
  centerElement?: JSX.Element
  rightElement?: JSX.Element
  alwaysShowCenterElement?: boolean
  fullScreen?: boolean // Expand to device edges
  backgroundColor?: keyof Theme['colors']
  backButtonColor?: keyof Theme['colors']
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
  rightElement = <Box width={theme.iconSizes.icon24} />,
  alwaysShowCenterElement,
  fullScreen = false,
  backgroundColor,
  backButtonColor,
}: ScrollHeaderProps): JSX.Element {
  // scrolls to top when tapping on the active tab
  useScrollToTop(listRef)

  const visibleOnScrollStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, showHeaderScrollYDistance],
        [0, 1],
        Extrapolate.CLAMP
      ),
    }
  })

  const insets = useSafeAreaInsets()
  const headerRowStyles = useMemo(() => {
    return fullScreen
      ? {
          paddingTop: insets.top,
        }
      : { paddingTop: 0 }
  }, [fullScreen, insets.top])

  const headerWrapperStyles = fullScreen ? [visibleOnScrollStyle, { zIndex: zIndices.popover }] : []

  return (
    <HeaderWrapper
      backgroundColor={backgroundColor}
      fullScreen={fullScreen}
      style={headerWrapperStyles}>
      <WithScrollToTop ref={listRef}>
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          mx="spacing16"
          my="spacing12"
          style={headerRowStyles}>
          <BackButton color={backButtonColor} />
          <Flex shrink>
            {alwaysShowCenterElement ? (
              centerElement
            ) : (
              <AnimatedBox style={visibleOnScrollStyle}>{centerElement}</AnimatedBox>
            )}
          </Flex>
          {rightElement}
        </Flex>
        <AnimatedBox
          borderBottomColor={backgroundColor ?? 'surface3'}
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
  backgroundColor = 'surface1',
}: {
  fullScreen: boolean
  children: ReactElement
  style?: StyleProp<Animated.AnimateStyle<StyleProp<ViewStyle>>>
  backgroundColor?: keyof typeof theme.colors
}): JSX.Element {
  if (!fullScreen) {
    return <Box bg={backgroundColor}>{children}</Box>
  }
  return (
    <AnimatedBox
      bg={backgroundColor}
      left={0}
      opacity={0}
      position="absolute"
      right={0}
      style={style}
      top={0}>
      {children}
    </AnimatedBox>
  )
}
