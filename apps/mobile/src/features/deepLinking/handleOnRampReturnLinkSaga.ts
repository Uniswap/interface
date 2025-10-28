import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { navigate } from 'src/app/navigation/rootNavigation'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { dismissInAppBrowser } from 'src/utils/linking'
import { call, put } from 'typed-redux-saga'
import { forceFetchFiatOnRampTransactions } from 'uniswap/src/features/transactions/slice'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

export function* handleOnRampReturnLink() {
  yield* put(forceFetchFiatOnRampTransactions())

  const isBottomTabsEnabled = getFeatureFlag(FeatureFlags.BottomTabs)

  if (!isBottomTabsEnabled) {
    yield* call(navigate, MobileScreens.Home, { tab: HomeScreenTabIndex.Activity })
  } else {
    yield* call(navigate, MobileScreens.Activity)
  }
  yield* call(dismissInAppBrowser)
}
