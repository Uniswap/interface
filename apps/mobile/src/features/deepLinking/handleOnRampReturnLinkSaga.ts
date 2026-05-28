import { navigate } from 'src/app/navigation/rootNavigation'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { dismissInAppBrowser } from 'src/utils/linking'
import { call, put } from 'typed-redux-saga'
import { forceFetchFiatOnRampTransactions } from 'uniswap/src/features/transactions/slice'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

export function* handleOnRampReturnLink() {
  yield* put(forceFetchFiatOnRampTransactions())
  yield* call(navigate, MobileScreens.Home, { tab: HomeScreenTabIndex.Activity })
  yield* call(dismissInAppBrowser)
}
