import { useRoute } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { useHomeScreenCustomAndroidBackButton } from 'src/app/navigation/hooks'
import type { AppStackScreenProp } from 'src/app/navigation/types'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

interface HomeScreenPortfolioTabState {
  tabIndex: number
  onTabIndexChange: (index: number) => void
}

export function useHomeScreenPortfolioTabState(showEmptyWalletState: boolean): HomeScreenPortfolioTabState {
  const route = useRoute<AppStackScreenProp<MobileScreens.Home>['route']>()
  const [routeTabIndex, setRouteTabIndex] = useState(route.params?.tab ?? HomeScreenTabIndex.Tokens)
  const tabIndex = showEmptyWalletState ? HomeScreenTabIndex.Tokens : routeTabIndex

  useHomeScreenCustomAndroidBackButton(routeTabIndex, setRouteTabIndex)

  useEffect(
    function syncTabIndexFromRoute() {
      const newTabIndex = route.params?.tab
      if (newTabIndex === undefined) {
        return
      }
      setRouteTabIndex(newTabIndex)
    },
    [route.params?.tab],
  )

  return { tabIndex, onTabIndexChange: setRouteTabIndex }
}
