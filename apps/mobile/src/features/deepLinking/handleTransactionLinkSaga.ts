import { navigate } from 'src/app/navigation/rootNavigation'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { call, put } from 'typed-redux-saga'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

export function* handleTransactionLink() {
  const isBottomTabsEnabled = getFeatureFlag(FeatureFlags.BottomTabs)

  if (!isBottomTabsEnabled) {
    yield* call(navigate, MobileScreens.Home, { tab: HomeScreenTabIndex.Activity })
  } else {
    yield* call(navigate, MobileScreens.Activity)
  }
  yield* put(closeAllModals())
}
