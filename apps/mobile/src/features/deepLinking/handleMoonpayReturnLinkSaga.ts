import { navigate } from 'src/app/navigation/rootNavigation'
import { TabIndex } from 'src/screens/HomeScreen'
import { Screens } from 'src/screens/Screens'
import { dismissInAppBrowser } from 'src/utils/linking'
import { call, put } from 'typed-redux-saga'
import { forceFetchFiatOnRampTransactions } from 'wallet/src/features/transactions/slice'

export function* handleMoonpayReturnLink() {
  yield* put(forceFetchFiatOnRampTransactions())
  yield* call(navigate, Screens.Home, { tab: TabIndex.Activity })
  yield* call(dismissInAppBrowser)
}
