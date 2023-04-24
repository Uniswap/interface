import { CallEffect, PutEffect } from 'redux-saga/effects'
import { navigate } from 'src/app/navigation/rootNavigation'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { TabIndex } from 'src/screens/HomeScreen'
import { Screens } from 'src/screens/Screens'
import { call, put } from 'typed-redux-saga'

export function* handleTransactionLink(): Generator<
  | CallEffect<never>
  | PutEffect<{
      payload: undefined
      type: string
    }>,
  void,
  unknown
> {
  yield* call(navigate, Screens.Home, { tab: TabIndex.Activity })
  yield* put(closeAllModals())
}
