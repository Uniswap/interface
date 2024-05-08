import { navigate } from 'src/app/navigation/rootNavigation'
import { HomeScreenTabIndex } from 'src/screens/HomeScreenTabIndex'
import { Screens } from 'src/screens/Screens'
import { call, put } from 'typed-redux-saga'
import { forceFetchFiatOnRampTransactions } from 'wallet/src/features/transactions/slice'
import { dismissInAppBrowser } from 'wallet/src/utils/linking'

export function* handleMoonpayReturnLink() {
  yield* put(forceFetchFiatOnRampTransactions())
  yield* call(navigate, Screens.Home, { tab: HomeScreenTabIndex.Activity })
  yield* call(dismissInAppBrowser)
}
