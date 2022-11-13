import { useScrollToTop } from '@react-navigation/native'
import { BlurView } from 'expo-blur'
import React, { PropsWithChildren, ReactElement, useMemo, useRef } from 'react'
import { useColorScheme, ViewStyle } from 'react-native'
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatedFlex, Box } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { WithScrollToTop } from 'src/components/layout/screens/WithScrollToTop'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'

const CONTENT_MAX_SCROLL_Y = 50

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

// Types for React Native View prop pointerEvents, necessary typing for AnimatedBlurView's animatedProps
type PointerEvent = 'auto' | 'none'

type HeaderScrollScreenProps = {
  fixedHeader: ReactElement
  contentHeader?: ReactElement
  background?: ReactElement
  maxScrollHeightOverride?: number
}

export function HeaderScrollScreen({
  fixedHeader,
  contentHeader,
  background,
  maxScrollHeightOverride,
  children,
}: PropsWithChildren<HeaderScrollScreenProps>) {
  const listRef = useRef(null)
  useScrollToTop(listRef)

  const isDarkMode = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)

  const maxScroll = maxScrollHeightOverride ?? CONTENT_MAX_SCROLL_Y

  // On scroll, ListContentHeader fades out and FixedHeaderBar fades in
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(event.contentOffset.y > maxScroll / 2 ? maxScroll : 0)
    },
  })

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, maxScroll], [0, 1], Extrapolate.CLAMP),
      zIndex: scrollY.value === 0 ? -1 : 10,
      // need zIndex at -1 if unscrolled otherwise the ContentHeader is not clickable
    }
  })

  const blurViewProps = useAnimatedProps(() => {
    return {
      pointerEvents: (scrollY.value === 0 ? 'none' : 'auto') as PointerEvent,
    }
  })

  const contentHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, maxScroll], [1, 0], Extrapolate.CLAMP),
    }
  })

  const ContentHeader = useMemo(
    () => <AnimatedFlex style={contentHeaderStyle}>{contentHeader}</AnimatedFlex>,
    [contentHeader, contentHeaderStyle]
  )

  const FixedHeaderBar = useMemo(
    () => (
      <AnimatedBlurView
        animatedProps={blurViewProps}
        intensity={95}
        style={[
          headerStyle,
          BlurHeaderStyle,
          {
            paddingTop: insets.top,
          },
        ]}
        tint={isDarkMode ? 'dark' : 'default'}>
        <WithScrollToTop ref={listRef}>
          <Box mx="md" my="xxs">
            {fixedHeader}
          </Box>
        </WithScrollToTop>
      </AnimatedBlurView>
    ),
    [blurViewProps, fixedHeader, headerStyle, insets.top, isDarkMode]
  )

  return (
    <Screen edges={['top', 'left', 'right']}>
      {background}
      {FixedHeaderBar}
      <VirtualizedList
        ref={listRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}>
        {ContentHeader}
        {children}
      </VirtualizedList>
    </Screen>
  )
}

const BlurHeaderStyle: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
}
