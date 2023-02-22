import { CallEffect } from 'redux-saga/effects'
import { navigate } from 'src/app/navigation/rootNavigation'
import { TabIndex } from 'src/screens/HomeScreen'
import { Screens } from 'src/screens/Screens'
import { call } from 'typed-redux-saga'

export function* handleTransactionLink(): Generator<CallEffect<never>, void, unknown> {
  yield* call(navigate, Screens.Home, { tab: TabIndex.Activity })
}
