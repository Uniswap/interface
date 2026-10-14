import { navigate } from 'src/app/navigation/rootNavigation'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { call, put } from 'typed-redux-saga'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

export function* handleTransactionLink() {
  yield* call(navigate, MobileScreens.MainTabs, { screen: MobileScreens.Activity } as const, { pop: true })
  yield* put(closeAllModals())
}
