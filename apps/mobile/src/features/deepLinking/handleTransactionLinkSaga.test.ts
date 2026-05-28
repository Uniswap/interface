import { call, put } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLinkSaga'
import { closeAllModals } from 'src/features/modals/modalSlice'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

describe(handleTransactionLink, () => {
  it('Navigates to the activity screen when opening a transaction notification', () => {
    return expectSaga(handleTransactionLink)
      .provide([
        [put(closeAllModals()), undefined],
        [call(navigate, MobileScreens.Activity), undefined],
      ])
      .silentRun()
  })
})
