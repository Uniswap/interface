import { call } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLink'
import { TabIndex } from 'src/screens/HomeScreen'
import { Screens } from 'src/screens/Screens'

describe(handleTransactionLink, () => {
  it('Navigates to the home screen when opening a transaction notification', () => {
    return expectSaga(handleTransactionLink)
      .provide([[call(navigate, Screens.Home, { tab: TabIndex.Activity }), undefined]])
      .silentRun()
  })
})
