import { navigate } from 'src/app/navigation/rootNavigation'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { call, put } from 'typed-redux-saga'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

export function* handleTransactionLink() {
  yield* call(navigate, MobileScreens.Home, { tab: HomeScreenTabIndex.Activity })
  yield* put(closeAllModals())
}
