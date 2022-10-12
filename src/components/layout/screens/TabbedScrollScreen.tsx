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
import { Route, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view'
import { ScrollEvent } from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView'
import { useAppTheme } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout/Box'
import { AnimatedFlex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { EXPERIMENTS, EXP_VARIANTS } from 'src/features/experiments/constants'
import { useExperimentVariant } from 'src/features/experiments/hooks'
import { dimensions } from 'src/styles/sizing'
import { theme as FixedTheme } from 'src/styles/theme'

const SIDEBAR_SWIPE_CONTAINER_WIDTH = 45

type TabbedScrollScreenProps = {
  contentHeader?: ReactElement
  scrollHeader?: ReactElement
  renderTab: (
    route: Route,
    scrollProps: TabViewScrollProps,
    loadingContainerStyle: ViewStyle
  ) => ReactElement | null
  tabs: { key: string; title: string }[]
}

export type TabViewScrollProps = {
  ref: Ref<any>
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent> | ScrollEvent) => void
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
  indicator: { backgroundColor: FixedTheme.colors.userThemeMagenta, height: 2 },
  tab: { margin: 0, padding: 0, top: 0 },
  tabBar: {
    paddingHorizontal: FixedTheme.spacing.lg,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  tabView: {
    marginHorizontal: FixedTheme.spacing.md,
  },
})

export const renderTabLabel = ({ route, focused }: { route: Route; focused: boolean }) => {
  return (
    <Text color={focused ? 'textPrimary' : 'textTertiary'} variant="mediumLabel">
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
  scrollHeader,
  renderTab,
  tabs,
}: TabbedScrollScreenProps) {
  const insets = useSafeAreaInsets()
  const theme = useAppTheme()
  const navigation = useAppStackNavigation()

  const tabsExperimentsVariant = useExperimentVariant(
    EXPERIMENTS.StickyTabsHeader,
    EXP_VARIANTS.Tabs
  )

  const [headerHeight, setHeaderHeight] = useState(INITIAL_TAB_BAR_HEIGHT) // estimation for initial height, updated on layout
  const [scrollHeaderHeight, setScrollHeaderHeight] = useState(INITIAL_TAB_BAR_HEIGHT) // estimation for initial height, updated on layout
  const animatedScrollY = useSharedValue(0)
  const isListGliding = useRef(false)

  const routes = tabs
  const [tabIndex, setIndex] = useState(0)
  const tabRefs = useRef<{ key: string; value: any; lastScrollOffset?: number }[]>([])

  const openSidebar = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer())
  }, [navigation])

  const panSidebarContainerGesture = useMemo(
    () => panSidebarContainerGestureAction(openSidebar),
    [openSidebar]
  )
  const panHeaderGesture = useMemo(() => panHeaderGestureAction(openSidebar), [openSidebar])

  const tabBarAnimatedStyle = useAnimatedStyle(() => {
    // If scrollHeader exists, we must account for scrollHeader padding which is equal to insets.top
    let tabBarTop = Math.max(scrollHeaderHeight - insets.top, 0)

    if (
      tabsExperimentsVariant === EXP_VARIANTS.TitleActions ||
      tabsExperimentsVariant === EXP_VARIANTS.Tabs
    ) {
      tabBarTop = 0
    }
    return {
      transform: [
        {
          translateY: interpolate(
            animatedScrollY.value,
            [0, headerHeight],
            [headerHeight, tabBarTop],
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
          { backgroundColor: theme.colors.backgroundBackdrop },
        ]}>
        <TabBar
          {...sceneProps}
          indicatorStyle={[TabStyles.indicator]}
          navigationState={{ index: tabIndex, routes }}
          renderLabel={renderTabLabel}
          style={[TabStyles.tab, { backgroundColor: theme.colors.backgroundBackdrop }]}
          onTabPress={({ preventDefault, route }) => {
            if (isListGliding.current) {
              preventDefault()
            }
            animatedScrollY.value = 0

            const found = tabRefs.current.find((e) => e.key === route.key)
            if (found) {
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

  const scrollHeaderAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            animatedScrollY.value,
            [0, headerHeight],
            [-headerHeight, 0],
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
      newTabRef?.value.scrollToOffset(0)
      animatedScrollY.value = 0
    }

    // TODO (Thomas): Handle case where both tabs have scrolled but new tab has scrolled less than the other
  }
  return (
    <Screen edges={['top', 'left', 'right']}>
      <TabView
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
      {scrollHeader && (
        <AnimatedFlex
          bg="backgroundBackdrop"
          style={[TabStyles.header, scrollHeaderAnimatedStyle, { paddingTop: insets.top }]}
          onLayout={(event: LayoutChangeEvent) =>
            setScrollHeaderHeight(event.nativeEvent.layout.height)
          }>
          {scrollHeader}
        </AnimatedFlex>
      )}
    </Screen>
  )
}
