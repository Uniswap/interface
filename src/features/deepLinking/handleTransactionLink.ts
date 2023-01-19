import { CallEffect } from 'redux-saga/effects'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Screens } from 'src/screens/Screens'
import { call } from 'typed-redux-saga'

export function* handleTransactionLink(): Generator<CallEffect<never>, void, unknown> {
  yield* call(navigate, Screens.Activity)
}
