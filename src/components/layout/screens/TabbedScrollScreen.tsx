import React, { ReactElement, Ref, useRef, useState } from 'react'
import {
  Animated,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Route, SceneRendererProps, TabBar, TabView } from 'react-native-tab-view'
import { ScrollEvent } from 'recyclerlistview/dist/reactnative/core/scrollcomponent/BaseScrollView'
import { useAppTheme } from 'src/app/hooks'
import { Flex } from 'src/components/layout/Flex'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { dimensions } from 'src/styles/sizing'

type TabbedScrollScreenProps = {
  headerContent: ReactElement
  renderTab: (
    route: Route,
    scrollProps: TabViewScrollProps,
    loadingContainerStyle: ViewStyle
  ) => ReactElement | null
  tabs: { key: string; title: string }[]
}

export type TabViewScrollProps = {
  ref: Ref<any>
  onMomentumScrollBegin: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent> | ScrollEvent) => void
  contentContainerStyle: ViewStyle
}

export const TAB_VIEW_SCROLL_THROTTLE = 16
const TAB_BAR_HEIGHT = 48
const INITIAL_TAB_BAR_HEIGHT = 100

const styles = StyleSheet.create({
  header: {
    marginBottom: 0,
    paddingBottom: 0,
    position: 'absolute',
    width: '100%',
  },
  indicator: { height: 2 },
  tab: { margin: 0, padding: 0, top: 0 },
  tabBar: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
})

const renderLabel = ({ route, focused }: { route: Route; focused: boolean }) => {
  return (
    <Text color={focused ? 'textPrimary' : 'textTertiary'} variant="mediumLabel">
      {route.title}
    </Text>
  )
}

export default function TabbedScrollScreen({
  headerContent,
  renderTab,
  tabs,
}: TabbedScrollScreenProps) {
  const theme = useAppTheme()
  const insets = useSafeAreaInsets()
  const [headerHeight, setHeaderHeight] = useState(INITIAL_TAB_BAR_HEIGHT) // estimation for initial height, updated on layout

  const [tabIndex, setIndex] = useState(0)
  const routes = tabs

  const scrollY = useRef(new Animated.Value(0)).current
  const tabRefs = useRef<{ key: string; value: Ref<any> }[]>([])
  const isListGliding = useRef(false)

  const renderTabBar = (sceneProps: SceneRendererProps) => {
    const tabBarYPosition = scrollY.interpolate({
      inputRange: [0, headerHeight],
      outputRange: [headerHeight, 0],
      extrapolateRight: 'clamp',
    })
    return (
      <Animated.View
        style={[
          styles.tabBar,
          {
            transform: [{ translateY: tabBarYPosition }],
          },
        ]}>
        <TabBar
          {...sceneProps}
          indicatorStyle={[styles.indicator, { backgroundColor: theme.colors.accentBranded }]}
          navigationState={{ index: tabIndex, routes }}
          renderLabel={renderLabel}
          style={[styles.tab, { backgroundColor: theme.colors.backgroundBackdrop }]}
          onTabPress={({ preventDefault }) => {
            if (isListGliding.current) {
              preventDefault()
            }
            scrollY.setValue(0) // TODO (Thomas): Implement scroll state updates between tabs
          }}
        />
      </Animated.View>
    )
  }

  const headerY = scrollY.interpolate({
    inputRange: [0, headerHeight + insets.top],
    outputRange: [0, -headerHeight - insets.top],
    extrapolateRight: 'clamp',
  })

  const scrollProps: TabViewScrollProps = {
    onMomentumScrollBegin: () => {},
    onMomentumScrollEnd: () => {},
    onScrollEndDrag: () => {},
    ref: (ref: Ref<any>) => {
      const route = routes[tabIndex]
      if (ref && route) {
        const found = tabRefs.current.find((e) => e.key === route.key)
        if (!found) {
          tabRefs.current.push({ key: route.key, value: ref })
        }
      }
    },
    onScroll: Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: false, // TODO (Thomas): Implement native driver
    }),
    contentContainerStyle: {
      paddingTop: headerHeight + TAB_BAR_HEIGHT,
      minHeight: dimensions.fullHeight - TAB_BAR_HEIGHT, // TODO (Thomas): Clean up these values in refactor
    },
  }

  const loadingContainerStyle = {
    paddingTop: headerHeight + TAB_BAR_HEIGHT,
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <TabView
        initialLayout={{
          height: 0,
          width: dimensions.fullWidth,
        }}
        lazy={true}
        navigationState={{ index: tabIndex, routes }}
        renderScene={(props) => renderTab(props.route, scrollProps, loadingContainerStyle)}
        renderTabBar={renderTabBar}
        style={{ marginHorizontal: theme.spacing.md }}
        onIndexChange={setIndex}
      />

      <Animated.View
        style={[styles.header, { marginTop: insets.top, transform: [{ translateY: headerY }] }]}>
        <Flex
          onLayout={(event: LayoutChangeEvent) => setHeaderHeight(event.nativeEvent.layout.height)}>
          {headerContent}
        </Flex>
      </Animated.View>
    </Screen>
  )
}
