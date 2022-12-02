import { navigate } from 'src/app/navigation/rootNavigation'
import { Screens } from 'src/screens/Screens'
import { call } from 'typed-redux-saga'

export function* handleTransactionLink() {
  yield* call(navigate, Screens.Activity)
}
