import { Flex, Text } from '@universe/mycelium'
import { TestIDType } from '@universe/test'
import React from 'react'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import { Route } from 'react-native-tab-view'
import { colorsLight, spacing } from 'ui/src/theme'

export const TAB_VIEW_SCROLL_THROTTLE = 16
export const TAB_BAR_HEIGHT = 48

export const TAB_STYLES = StyleSheet.create({
  activeTabIndicator: {
    backgroundColor: colorsLight.accent1,
    bottom: 0,
    height: 0,
    position: 'absolute',
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
    paddingTop: spacing.spacing4,
  },
})

export type HeaderConfig = {
  heightExpanded: number
  heightCollapsed: number
}

export type TabProps = {
  owner: string
  containerProps?: TabContentProps
  isExternalProfile?: boolean
  renderedInModal?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  isActiveTab?: boolean
  testID?: TestIDType
}

export type TabContentProps = {
  contentContainerStyle: StyleProp<ViewStyle>
  emptyComponentStyle?: StyleProp<ViewStyle>
}

export type TabLabelProps = {
  route: Route
  focused: boolean
  isExternalProfile?: boolean
  textStyleType?: 'primary' | 'secondary'
}
export const TabLabel = ({ route, focused, textStyleType = 'primary' }: TabLabelProps): JSX.Element => {
  return (
    <Flex row alignItems="center" gap="$spacing4" testID={`home-tab-${route.title}`}>
      <Text
        color={
          focused
            ? textStyleType === 'primary'
              ? '$neutral1'
              : '$neutral2'
            : textStyleType === 'primary'
              ? '$neutral2'
              : '$neutral3'
        }
        variant={textStyleType === 'primary' ? 'body1' : 'subheading2'}
      >
        {route.title}
      </Text>
    </Flex>
  )
}
