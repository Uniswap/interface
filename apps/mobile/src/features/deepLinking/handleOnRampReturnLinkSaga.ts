import { navigate } from 'src/app/navigation/rootNavigation'
import { HomeScreenTabIndex } from 'src/screens/HomeScreenTabIndex'
import { call, put } from 'typed-redux-saga'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { forceFetchFiatOnRampTransactions } from 'wallet/src/features/transactions/slice'
import { dismissInAppBrowser } from 'wallet/src/utils/linking'

export function* handleOnRampReturnLink() {
  yield* put(forceFetchFiatOnRampTransactions())
  yield* call(navigate, MobileScreens.Home, { tab: HomeScreenTabIndex.Activity })
  yield* call(dismissInAppBrowser)
}
