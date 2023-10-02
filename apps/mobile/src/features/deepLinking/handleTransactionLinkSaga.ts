import { navigate } from 'src/app/navigation/rootNavigation'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { HomeScreenTabIndex } from 'src/screens/HomeScreenTabIndex'
import { Screens } from 'src/screens/Screens'
import { call, put } from 'typed-redux-saga'

export function* handleTransactionLink() {
  yield* call(navigate, Screens.Home, { tab: HomeScreenTabIndex.Activity })
  yield* put(closeAllModals())
}
