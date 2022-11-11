/* eslint-disable react-native/no-unused-styles */
import React from 'react'
import { StyleSheet } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
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
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
  tabBar: {
    // add inactive border to bottom of tab bar
    borderBottomWidth: 1,
    margin: 0,
    marginHorizontal: FixedTheme.spacing.lg,
    padding: 0,
    // remove default shadow border under tab bar
    shadowColor: FixedTheme.colors.none,
    shadowOpacity: 0,
    shadowRadius: 0,
    top: 0,
  },
  // Use on tab components as the parent wrapper, see TokensTab
  tabContentContainerStandard: {
    paddingHorizontal: FixedTheme.spacing.lg,
    paddingTop: FixedTheme.spacing.sm,
  },
  // Use on tab components where the content should bleed over boundary, see NftTab
  tabContentContainerWide: {
    paddingTop: FixedTheme.spacing.sm,
  },
  // Used on screens that have a custom <TabView />, see ExploreScreen for example
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
