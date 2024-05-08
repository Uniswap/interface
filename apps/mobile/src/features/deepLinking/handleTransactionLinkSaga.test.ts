import { call, put } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLinkSaga'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { HomeScreenTabIndex } from 'src/screens/HomeScreenTabIndex'
import { Screens } from 'src/screens/Screens'

describe(handleTransactionLink, () => {
  it('Navigates to the home screen when opening a transaction notification', () => {
    return expectSaga(handleTransactionLink)
      .provide([
        [put(closeAllModals()), undefined],
        [call(navigate, Screens.Home, { tab: HomeScreenTabIndex.Activity }), undefined],
      ])
      .silentRun()
  })
})
