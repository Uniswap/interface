/* eslint-disable react-native/no-unused-styles */
import { FlashList, FlashListProps } from '@shopify/flash-list'
import React, { RefObject } from 'react'
import {
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { Route } from 'react-native-tab-view/lib/typescript/types'
import { Text } from 'src/components/Text'
import { theme as FixedTheme } from 'src/styles/theme'

export const TAB_VIEW_SCROLL_THROTTLE = 16
export const TAB_BAR_HEIGHT = 48
export const SWIPE_THRESHOLD = 5

export const TAB_STYLES = StyleSheet.create({
  activeTabIndicator: {
    backgroundColor: FixedTheme.colors.userThemeMagenta,
    bottom: -1,
    height: 2,
    position: 'absolute',
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    marginBottom: 0,
    paddingBottom: 0,
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  headerContainer: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  tabBar: {
    // add inactive border to bottom of tab bar
    borderBottomWidth: 1,
    margin: 0,
    marginHorizontal: FixedTheme.spacing.spacing24,
    padding: 0,
    // remove default shadow border under tab bar
    shadowColor: FixedTheme.colors.none,
    shadowOpacity: 0,
    shadowRadius: 0,
    top: 0,
  },
  // For container components that wrap lists within tabs.
  tabListContainer: {
    paddingHorizontal: FixedTheme.spacing.spacing24,
  },
  // For padding on the list components themselves within tabs.
  tabListInner: {
    paddingTop: FixedTheme.spacing.spacing8,
  },
})

export type HeaderConfig = {
  heightExpanded: number
  heightCollapsed: number
}

export type ScrollPair = {
  list: RefObject<FlatList> | RefObject<FlashList<unknown>>
  position: Animated.SharedValue<number>
  index: number
}

export type TabContentProps = Partial<FlatListProps<unknown>> & {
  loadingContainerStyle: StyleProp<ViewStyle>
  estimatedItemSize?: number
}

export const renderTabLabel = ({
  route,
  focused,
}: {
  route: Route
  focused: boolean
}): JSX.Element => {
  return (
    <Text color={focused ? 'textPrimary' : 'textTertiary'} variant="buttonLabelMedium">
      {route.title}
    </Text>
  )
}

/**
 * Keeps tab content in sync, by scrolling content in case collapsing header height has changed between tabs
 */
export const useScrollSync = (
  currentTabIndex: number,
  scrollPairs: ScrollPair[],
  headerConfig: HeaderConfig
): { sync: (event: NativeSyntheticEvent<NativeScrollEvent>) => void } => {
  const sync:
    | FlatListProps<unknown>['onMomentumScrollEnd']
    | FlashListProps<unknown>['onMomentumScrollEnd'] = (event) => {
    const { y } = event.nativeEvent.contentOffset

    const { heightCollapsed, heightExpanded } = headerConfig

    const headerDiff = heightExpanded - heightCollapsed

    for (const { list, position, index } of scrollPairs) {
      const scrollPosition = position.value

      if (scrollPosition > headerDiff && y > headerDiff) {
        continue
      }

      if (index !== currentTabIndex) {
        list.current?.scrollToOffset({
          offset: Math.min(y, headerDiff),
          animated: false,
        })
      }
    }
  }

  return { sync }
}
