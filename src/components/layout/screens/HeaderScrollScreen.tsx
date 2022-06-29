import { BlurView } from 'expo-blur'
import React, { PropsWithChildren, ReactElement } from 'react'
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
import { VirtualizedList } from 'src/components/layout/VirtualizedList'

const CONTENT_MAX_SCROLL_Y = 50

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

// Types for React Native View prop pointerEvents, necessary typing for AnimatedBlurView's animatedProps
type PointerEvent = 'auto' | 'none'

type HeaderScrollScreenProps = {
  fixedHeader: ReactElement
  contentHeader?: ReactElement
  background?: ReactElement
}

export function HeaderScrollScreen({
  fixedHeader,
  contentHeader,
  background,
  children,
}: PropsWithChildren<HeaderScrollScreenProps>) {
  const isDarkMode = useColorScheme() === 'dark'
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)

  // On scroll, ListContentHeader fades out and FixedHeaderBar fades in
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(
        event.contentOffset.y > CONTENT_MAX_SCROLL_Y / 2 ? CONTENT_MAX_SCROLL_Y : 0
      )
    },
  })

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [0, 1], Extrapolate.CLAMP),
    }
  })

  const blurViewProps = useAnimatedProps(() => {
    return {
      pointerEvents: (scrollY.value === 0 ? 'none' : 'auto') as PointerEvent,
    }
  })

  const contentHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [1, 0], Extrapolate.CLAMP),
    }
  })

  const ContentHeader = (
    <AnimatedFlex mt="sm" mx="md" style={contentHeaderStyle}>
      {contentHeader}
    </AnimatedFlex>
  )

  const FixedHeaderBar = (
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
      <Box mx="md" my="sm">
        {fixedHeader}
      </Box>
    </AnimatedBlurView>
  )

  return (
    <Screen edges={['top', 'left', 'right']}>
      {background}
      {FixedHeaderBar}
      <VirtualizedList
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
  zIndex: 10,
}
