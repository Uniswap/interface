import { call, put } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleMoonpayReturnLink } from 'src/features/deepLinking/handleMoonpayReturnLink'
import { forceFetchFiatOnRampTransactions } from 'src/features/transactions/slice'
import { TabIndex } from 'src/screens/HomeScreen'
import { Screens } from 'src/screens/Screens'
import { dismissInAppBrowser } from 'src/utils/linking'

describe(handleMoonpayReturnLink, () => {
  it('Navigates to the home screen activity tab when coming back from moonpay', () => {
    return expectSaga(handleMoonpayReturnLink)
      .provide([
        [put(forceFetchFiatOnRampTransactions), undefined],
        [call(navigate, Screens.Home, { tab: TabIndex.Activity }), undefined],
        [call(dismissInAppBrowser), undefined],
      ])
      .silentRun()
  })
})
