import { BlurView } from 'expo-blur'
import React, { ReactElement } from 'react'
import { SectionList, SectionListProps, useColorScheme, ViewStyle } from 'react-native'
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
import { withAnimated } from 'src/components/animated'
import { Box } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'

const CONTENT_MAX_SCROLL_Y = 50

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

// Types for React Native View prop pointerEvents, necessary typing for AnimatedBlurView's animatedProps
type PointerEvent = 'auto' | 'none'

type HeaderListScreenProps = {
  fixedHeader: ReactElement
  contentHeader?: ReactElement
} & SectionListProps<any>

export function HeaderSectionListScreen({ fixedHeader, ...listProps }: HeaderListScreenProps) {
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
      {FixedHeaderBar}
      <AnimatedSectionList
        {...listProps}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
      />
    </Screen>
  )
}

const AnimatedSectionList = withAnimated(SectionList)

const BlurHeaderStyle: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  zIndex: 10,
}
