import { CallEffect, PutEffect } from 'redux-saga/effects'
import { navigate } from 'src/app/navigation/rootNavigation'
import { forceFetchFiatOnRampTransactions } from 'src/features/transactions/slice'
import { TabIndex } from 'src/screens/HomeScreen'
import { Screens } from 'src/screens/Screens'
import { dismissInAppBrowser } from 'src/utils/linking'
import { call, put } from 'typed-redux-saga'

export function* handleMoonpayReturnLink(): Generator<
  | CallEffect<void>
  | PutEffect<{
      payload: undefined
      type: string
    }>,
  void,
  unknown
> {
  yield* put(forceFetchFiatOnRampTransactions())
  yield* call(navigate, Screens.Home, { tab: TabIndex.Activity })
  yield* call(dismissInAppBrowser)
}
