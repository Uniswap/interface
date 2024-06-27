import { useScrollToTop } from '@react-navigation/native'
import React, { PropsWithChildren, useRef } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated'
import { Screen } from 'src/components/layout/Screen'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { ScrollHeader } from 'src/components/layout/screens/ScrollHeader'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { ColorTokens, Flex, flexStyles, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { HandleBar } from 'wallet/src/components/modals/HandleBar'

// Distance to scroll to show scrolled state header elements
const SHOW_HEADER_SCROLL_Y_DISTANCE = 50

type HeaderScrollScreenProps = {
  centerElement?: JSX.Element
  rightElement?: JSX.Element
  alwaysShowCenterElement?: boolean
  fullScreen?: boolean // Expand to device edges
  renderedInModal?: boolean // Apply styling to display within bottom sheet modal
  showHandleBar?: boolean // add handlebar element to top of view
  backgroundColor?: ColorTokens
  backButtonColor?: ColorTokens
}

export function HeaderScrollScreen({
  centerElement,
  rightElement = <Flex width={iconSizes.icon24} />,
  alwaysShowCenterElement,
  fullScreen = false,
  renderedInModal = false,
  showHandleBar = false,
  backgroundColor = '$surface1',
  backButtonColor,
  children,
}: PropsWithChildren<HeaderScrollScreenProps>): JSX.Element {
  const colors = useSporeColors()

  // difficult to properly type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<FlatList<any>>(null)

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

  return (
    <Screen
      backgroundColor={backgroundColor}
      edges={['top', 'left', 'right']}
      noInsets={fullScreen}>
      {showHandleBar ? <HandleBar backgroundColor={colors.surface1.get()} /> : null}
      <ScrollHeader
        alwaysShowCenterElement={alwaysShowCenterElement}
        backButtonColor={backButtonColor}
        backgroundColor={backgroundColor}
        centerElement={centerElement}
        fullScreen={fullScreen}
        listRef={listRef}
        rightElement={rightElement}
        scrollY={scrollY}
        showHeaderScrollYDistance={SHOW_HEADER_SCROLL_Y_DISTANCE}
      />
      <VirtualizedList
        ref={listRef}
        contentContainerStyle={flexStyles.grow}
        renderedInModal={renderedInModal}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={flexStyles.fill}
        onScroll={scrollHandler}>
        {children}
      </VirtualizedList>

      <HorizontalEdgeGestureTarget />
    </Screen>
  )
}
