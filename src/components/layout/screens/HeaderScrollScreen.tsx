import { useScrollToTop } from '@react-navigation/native'
import React, { PropsWithChildren, useMemo, useRef } from 'react'
import {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { BackButton } from 'src/components/buttons/BackButton'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { WithScrollToTop } from 'src/components/layout/screens/WithScrollToTop'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { theme } from 'src/styles/theme'

// Distance to scroll to show scrolled state header elements
const SHOW_HEADER_SCROLL_Y_DISTANCE = 50

type HeaderScrollScreenProps = {
  centerElement?: JSX.Element
  rightElement?: JSX.Element
  alwaysShowCenterElement?: boolean
}

export function HeaderScrollScreen({
  centerElement,
  rightElement = <Box width={theme.iconSizes.icon24} />,
  alwaysShowCenterElement,
  children,
}: PropsWithChildren<HeaderScrollScreenProps>): JSX.Element {
  // difficult to properly type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<any>(null)

  // scrolls to top when tapping on the active tab
  useScrollToTop(listRef)

  const scrollY = useSharedValue(0)

  // On scroll, centerElement and the bottom border fade in
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(event.contentOffset.y > 0 ? SHOW_HEADER_SCROLL_Y_DISTANCE : 0)
    },
  })

  const visibleOnScrollStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, SHOW_HEADER_SCROLL_Y_DISTANCE],
        [0, 1],
        Extrapolate.CLAMP
      ),
    }
  })

  const FixedHeaderBar = useMemo(
    () => (
      <Box bg="background0">
        <WithScrollToTop ref={listRef}>
          <Flex
            row
            alignItems="center"
            justifyContent="space-between"
            mx="spacing16"
            my="spacing12">
            <BackButton />
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
            borderBottomColor="backgroundOutline"
            borderBottomWidth={0.25}
            height={1}
            overflow="visible"
            style={visibleOnScrollStyle}
          />
        </WithScrollToTop>
      </Box>
    ),
    [centerElement, rightElement, alwaysShowCenterElement, visibleOnScrollStyle]
  )

  return (
    <Screen edges={['top', 'left', 'right']}>
      {FixedHeaderBar}
      <VirtualizedList
        ref={listRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}>
        {children}
      </VirtualizedList>
    </Screen>
  )
}
