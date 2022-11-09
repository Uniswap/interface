import { DrawerActions } from '@react-navigation/core'
import React, { ReactElement, Ref, useCallback, useMemo, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Route, SceneRendererProps, TabBar } from 'react-native-tab-view'
import { useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout/Box'
import { AnimatedFlex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import TraceTabView from 'src/components/telemetry/TraceTabView'
import { Text } from 'src/components/Text'
import { SectionName } from 'src/features/telemetry/constants'
import { dimensions } from 'src/styles/sizing'
import { theme as FixedTheme } from 'src/styles/theme'

const SIDEBAR_SWIPE_CONTAINER_WIDTH = 50

type TabbedScrollScreenProps = {
  contentHeader?: ReactElement
  headerHeightEstimate?: number
  renderTab: (
    route: Route,
    scrollProps: TabViewScrollProps,
    loadingContainerStyle: ViewStyle
  ) => ReactElement | null
  tabs: { key: SectionName; title: string }[]
  disableOpenSidebarGesture?: boolean
}

export type TabViewScrollProps = {
  ref: Ref<any>
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  contentContainerStyle: ViewStyle
}

export const TAB_VIEW_SCROLL_THROTTLE = 16
const TAB_BAR_HEIGHT = 48
const INITIAL_TAB_BAR_HEIGHT = 100
const SWIPE_THRESHOLD = 5

export const TabStyles = StyleSheet.create({
  header: {
    marginBottom: 0,
    paddingBottom: 0,
    position: 'absolute',
    width: '100%',
  },
  indicator: {
    backgroundColor: FixedTheme.colors.userThemeMagenta,
    bottom: -1,
    height: 2,
    position: 'absolute',
  },
  tab: {
    // add inactive border to bottom of tab bar
    borderBottomWidth: 1,
    margin: 0,
    padding: 0,
    // remove default shadow border under tab bar
    shadowColor: FixedTheme.colors.none,
    shadowOpacity: 0,
    shadowRadius: 0,
    top: 0,
  },
  tabBar: {
    paddingHorizontal: FixedTheme.spacing.lg,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  // Use on tab components as the parent wrapper, see TokensTab
  // eslint-disable-next-line react-native/no-unused-styles
  tabContentContainerStandard: {
    paddingHorizontal: FixedTheme.spacing.lg,
    paddingVertical: FixedTheme.spacing.sm,
  },
  // Use on tab components where the content should bleed over boundary, see NftTab
  // eslint-disable-next-line react-native/no-unused-styles
  tabContentContainerWide: {
    paddingVertical: FixedTheme.spacing.sm,
  },
  // Used on screens that have a custom <TabView />, see ExploreScreen for example
  // eslint-disable-next-line react-native/no-unused-styles
  tabView: {
    marginHorizontal: FixedTheme.spacing.lg,
  },
})

export const renderTabLabel = ({ route, focused }: { route: Route; focused: boolean }) => {
  return (
    <Text color={focused ? 'textPrimary' : 'textTertiary'} variant="buttonLabelMedium">
      {route.title}
    </Text>
  )
}

export const panSidebarContainerGestureAction = (openSidebar: () => void) =>
  Gesture.Pan().onStart(({ translationX }) => {
    // only register as a side swipe above a certain threshold
    if (Math.abs(translationX) < SWIPE_THRESHOLD) {
      return
    }

    if (translationX > 0) {
      runOnJS(openSidebar)()
    }
  })

export const panHeaderGestureAction = (openSidebar: () => void) =>
  Gesture.Pan().onStart(({ translationX }) => {
    // only register as a side swipe above a certain threshold
    if (Math.abs(translationX) < SWIPE_THRESHOLD || translationX < 0) {
      return
    }

    runOnJS(openSidebar)()
  })

export default function TabbedScrollScreen({
  contentHeader,
  headerHeightEstimate,
  renderTab,
  tabs,
  disableOpenSidebarGesture,
}: TabbedScrollScreenProps) {
  const insets = useSafeAreaInsets()
  const theme = useAppTheme()
  const navigation = useAppStackNavigation()

  // estimation for initial height, updated on layout
  const [headerHeight, setHeaderHeight] = useState(headerHeightEstimate ?? INITIAL_TAB_BAR_HEIGHT)
  const animatedScrollY = useSharedValue(0)
  const isListGliding = useRef(false)

  const routes = tabs
  const [tabIndex, setIndex] = useState(0)
  const tabRefs = useRef<{ key: string; value: any; lastScrollOffset?: number }[]>([])

  const openSidebar = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer())
  }, [navigation])

  const panSidebarContainerGesture = useMemo(
    () => (disableOpenSidebarGesture ? undefined : panSidebarContainerGestureAction(openSidebar)),
    [disableOpenSidebarGesture, openSidebar]
  )
  const panHeaderGesture = useMemo(
    () => (disableOpenSidebarGesture ? undefined : panHeaderGestureAction(openSidebar)),
    [disableOpenSidebarGesture, openSidebar]
  )

  const tabBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            animatedScrollY.value,
            [0, headerHeight],
            [headerHeight, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    }
  })

  const renderTabBar = (sceneProps: SceneRendererProps) => {
    return (
      <Animated.View
        style={[
          TabStyles.tabBar,
          tabBarAnimatedStyle,
          { backgroundColor: theme.colors.background0 },
        ]}>
        <TabBar
          {...sceneProps}
          indicatorStyle={[TabStyles.indicator]}
          navigationState={{ index: tabIndex, routes }}
          renderLabel={renderTabLabel}
          style={[
            TabStyles.tab,
            {
              backgroundColor: theme.colors.background0,
              borderBottomColor: theme.colors.backgroundOutline,
            },
          ]}
          onTabPress={({ preventDefault, route }) => {
            if (isListGliding.current) {
              preventDefault()
            }
            animatedScrollY.value = 0

            const found = tabRefs.current.find((e) => e.key === route.key)
            if (found && found.value && found.value.scrollToOffset) {
              // TODO (Thomas): Figure out smooth scrolling for RecyclerListView
              found.value.scrollToOffset(0)
            }
          }}
        />
      </Animated.View>
    )
  }

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            animatedScrollY.value,
            [0, headerHeight + insets.top],
            [0, -headerHeight - insets.top],
            Extrapolate.CLAMP
          ),
        },
      ],
    }
  })

  const scrollPropsForTab = (routeKey: string) => {
    return {
      ref: (ref: Ref<any>) => {
        if (ref && routeKey) {
          const found = tabRefs.current.find((e) => e.key === routeKey)
          if (!found) {
            tabRefs.current.push({ key: routeKey, value: ref })
          }
        }
      },
      onScroll: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
        animatedScrollY.value = event.nativeEvent.contentOffset.y
      },
      contentContainerStyle: {
        paddingTop: headerHeight + TAB_BAR_HEIGHT,
        minHeight: dimensions.fullHeight - TAB_BAR_HEIGHT - headerHeight,
      },
    }
  }

  const loadingContainerStyle = {
    paddingTop: headerHeight + TAB_BAR_HEIGHT,
  }

  const onTabIndexChange = (index: number) => {
    // Update with last scroll position
    const previousTab = routes[tabIndex]
    const previousTabRef = tabRefs.current.find((e) => e.key === previousTab.key)
    if (previousTabRef) {
      previousTabRef.lastScrollOffset = animatedScrollY.value
    }

    setIndex(index)

    const newTab = routes[index]
    const newTabRef = tabRefs.current.find((e) => e.key === newTab.key)

    // If we switch tabs and the next tab hasn't scrolled, we want to avoid showing a blank padding space by scrolling to top on new tab.
    if (newTabRef && !newTabRef?.lastScrollOffset) {
      if (newTabRef?.value?.scrollToOffset) {
        newTabRef?.value.scrollToOffset(0)
        animatedScrollY.value = 0
      }
    }

    // TODO (Thomas): Handle case where both tabs have scrolled but new tab has scrolled less than the other
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <TraceTabView
        lazy
        initialLayout={{
          height: 0,
          width: dimensions.fullWidth,
        }}
        navigationState={{ index: tabIndex, routes }}
        renderScene={(props) =>
          renderTab(props.route, scrollPropsForTab(props.route.key), loadingContainerStyle)
        }
        renderTabBar={renderTabBar}
        onIndexChange={onTabIndexChange}
      />
      <GestureDetector gesture={panSidebarContainerGesture}>
        <Box
          bottom={0}
          height="100%"
          left={0}
          position="absolute"
          top={0}
          width={SIDEBAR_SWIPE_CONTAINER_WIDTH} // Roughly 1/2 icon width on tokens tab
        />
      </GestureDetector>

      <GestureDetector gesture={panHeaderGesture}>
        {contentHeader && (
          <AnimatedFlex
            style={[TabStyles.header, headerAnimatedStyle, { marginTop: insets.top }]}
            onLayout={(event: LayoutChangeEvent) =>
              setHeaderHeight(event.nativeEvent.layout.height)
            }>
            {contentHeader}
          </AnimatedFlex>
        )}
      </GestureDetector>
      {/* Background for OS status bar, needs higher zindex than contentHeader */}
      <Box
        bg="background0"
        height={insets.top}
        position="absolute"
        top={0}
        width="100%"
        zIndex="sticky"
      />
    </Screen>
  )
}
