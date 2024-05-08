/* eslint-disable react-native/no-unused-styles */
import { FlashList, FlashListProps } from '@shopify/flash-list'
import React, { RefObject, useCallback, useMemo } from 'react'
import {
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import Animated, { SharedValue } from 'react-native-reanimated'
import { Route } from 'react-native-tab-view'
import { PendingNotificationBadge } from 'src/features/notifications/PendingNotificationBadge'
import { Flex, Text } from 'ui/src'
import { colorsLight, spacing } from 'ui/src/theme'

export const TAB_VIEW_SCROLL_THROTTLE = 16
export const TAB_BAR_HEIGHT = 48
export const SWIPE_THRESHOLD = 5

export const TAB_STYLES = StyleSheet.create({
  activeTabIndicator: {
    backgroundColor: colorsLight.accent1,
    bottom: 0,
    height: 0,
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
    borderBottomWidth: 0,
    margin: 0,
    marginHorizontal: 0,
    padding: 0,
    // remove default shadow border under tab bar
    shadowColor: colorsLight.none,
    shadowOpacity: 0,
    shadowRadius: 0,
    top: 0,
  },
  // For padding on the list components themselves within tabs.
  tabListInner: {
    paddingBottom: spacing.spacing12,
    paddingTop: spacing.spacing8,
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

export type TabProps = {
  owner: string
  containerProps?: TabContentProps
  scrollHandler?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  isExternalProfile?: boolean
  renderedInModal?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  headerHeight?: number
}

export type TabContentProps = Partial<FlatListProps<unknown>> & {
  loadingContainerStyle: StyleProp<ViewStyle>
  emptyContainerStyle: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  estimatedItemSize?: number
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  scrollEventThrottle?: number
}

export const renderTabLabel = ({
  route,
  focused,
  isExternalProfile,
}: {
  route: Route
  focused: boolean
  isExternalProfile?: boolean
}): JSX.Element => {
  return (
    <Flex row alignItems="center" gap="$spacing4">
      <Text color={focused ? '$neutral1' : '$neutral2'} variant="body1">
        {route.title}
      </Text>
      {/* Streamline UI by hiding the Activity tab spinner when focused
      and showing it only on the specific pending transactions. */}
      {route.title === 'Activity' && !isExternalProfile && !focused ? (
        <PendingNotificationBadge />
      ) : null}
    </Flex>
  )
}

/**
 * Keeps tab content in sync, by scrolling content in case collapsing header height has changed between tabs
 */
export const useScrollSync = (
  currentTabIndex: SharedValue<number>,
  scrollPairs: ScrollPair[],
  headerConfig: HeaderConfig
): { sync: (event: NativeSyntheticEvent<NativeScrollEvent>) => void } => {
  const sync:
    | FlatListProps<unknown>['onMomentumScrollEnd']
    | FlashListProps<unknown>['onMomentumScrollEnd'] = useCallback(
    (event: { nativeEvent: NativeScrollEvent }) => {
      const { y } = event.nativeEvent.contentOffset

      const { heightCollapsed, heightExpanded } = headerConfig

      const headerDiff = heightExpanded - heightCollapsed

      for (const { list, position, index } of scrollPairs) {
        const scrollPosition = position.value

        if (scrollPosition > headerDiff && y > headerDiff) {
          continue
        }

        if (index !== currentTabIndex.value) {
          list.current?.scrollToOffset({
            offset: Math.min(y, headerDiff),
            animated: false,
          })
        }
      }
    },
    [currentTabIndex, scrollPairs, headerConfig]
  )

  return useMemo(() => ({ sync }), [sync])
}
