import { memo, useCallback, type ReactNode } from 'react'
import type { ViewStyle } from 'react-native'
import { TabLabel, TAB_STYLES } from 'src/components/layout/TabHelpers'
import type { HomeRoute } from 'src/screens/HomeScreen/portfolio/types'
import { Flex, TouchableArea } from 'ui/src'
import { spacing } from 'ui/src/theme'

interface HomeScreenPortfolioStickyTabBarProps {
  routes: HomeRoute[]
  tabIndex: number
  onTabIndexChange: (index: number) => void
  /** Optional element pinned to the right edge of the tab row. */
  rightAccessory?: ReactNode
}

export const HomeScreenPortfolioStickyTabBar = memo(function HomeScreenPortfolioStickyTabBarInner({
  routes,
  tabIndex,
  onTabIndexChange,
  rightAccessory,
}: HomeScreenPortfolioStickyTabBarProps): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      backgroundColor="$surface1"
      borderBottomColor="$surface3"
      borderBottomWidth={1}
      px="$spacing12"
      style={TAB_STYLES.tabBar as ViewStyle}
    >
      {routes.map((route, index) => (
        <HomeScreenPortfolioStickyTabButton
          key={route.key}
          focused={tabIndex === index}
          index={index}
          route={route}
          onTabIndexChange={onTabIndexChange}
        />
      ))}
      {rightAccessory ? (
        <Flex fill row justifyContent="flex-end" alignItems="center">
          {rightAccessory}
        </Flex>
      ) : null}
    </Flex>
  )
})

interface HomeScreenPortfolioStickyTabButtonProps {
  route: HomeRoute
  index: number
  focused: boolean
  onTabIndexChange: (index: number) => void
}

const HomeScreenPortfolioStickyTabButton = memo(function HomeScreenPortfolioStickyTabButtonInner({
  route,
  index,
  focused,
  onTabIndexChange,
}: HomeScreenPortfolioStickyTabButtonProps): JSX.Element {
  const handlePress = useCallback(() => {
    onTabIndexChange(index)
  }, [index, onTabIndexChange])

  const { textStyleType: theme, ...rest } = route

  return (
    <TouchableArea
      style={{ paddingVertical: spacing.spacing12, paddingHorizontal: spacing.spacing8 }}
      onPress={handlePress}
    >
      <TabLabel focused={focused} route={rest} textStyleType={theme} />
    </TouchableArea>
  )
})
