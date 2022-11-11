import { DrawerActions } from '@react-navigation/core'
import React, { ReactElement, Ref, useCallback, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ViewStyle } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Extrapolate,
  interpolate,
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
import {
  panHeaderGestureAction,
  panSidebarContainerGestureAction,
  renderTabLabel,
  TAB_BAR_HEIGHT,
  TAB_STYLES,
} from 'src/components/layout/TabHelpers'
import TraceTabView from 'src/components/telemetry/TraceTabView'
import { SectionName } from 'src/features/telemetry/constants'
import { dimensions } from 'src/styles/sizing'

const SIDEBAR_SWIPE_CONTAINER_WIDTH = 50

type TabbedScrollScreenProps = {
  contentHeader?: ReactElement
  headerHeightEstimate?: number
  renderTab: (
    route: Route,
    scrollProps: TabViewScrollProps,
    loadingContainerStyle: ViewStyle,
    setNftsTabReloadFn: (fn: () => void) => void
  ) => ReactElement | null
  tabs: { key: SectionName; title: string }[]
  disableOpenSidebarGesture?: boolean
}

export type TabViewScrollProps = {
  ref: Ref<any>
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  contentContainerStyle: ViewStyle
}

const INITIAL_TAB_BAR_HEIGHT = 100

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
          TAB_STYLES.header,
          tabBarAnimatedStyle,
          { backgroundColor: theme.colors.background0 },
        ]}>
        <TabBar
          {...sceneProps}
          indicatorStyle={TAB_STYLES.activeTabIndicator}
          navigationState={{ index: tabIndex, routes }}
          renderLabel={renderTabLabel}
          style={[
            TAB_STYLES.tabBar,
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

            // We only want to trigger a reload if the tapped tab is already the current active tab, not when switching tabs
            if (
              route.key === SectionName.HomeNFTsTab &&
              tabIndex ===
                routes.findIndex((currentRoute) => currentRoute.key === SectionName.HomeNFTsTab)
            ) {
              nftsTabReloadFn?.()
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

  // Since only the child tab has access to the refetch function, we pass this setState function to the child so it can set a callback after tapping on the tab.
  const [nftsTabReloadFn, setNftsTabReloadFn] = useState<() => void>()

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
          renderTab(
            props.route,
            scrollPropsForTab(props.route.key),
            loadingContainerStyle,
            setNftsTabReloadFn
          )
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
            style={[TAB_STYLES.header, headerAnimatedStyle, { marginTop: insets.top }]}
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
