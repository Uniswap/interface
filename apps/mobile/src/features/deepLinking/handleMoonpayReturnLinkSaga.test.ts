import { call, put } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleMoonpayReturnLink } from 'src/features/deepLinking/handleMoonpayReturnLinkSaga'
import { HomeScreenTabIndex } from 'src/screens/HomeScreenTabIndex'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { forceFetchFiatOnRampTransactions } from 'wallet/src/features/transactions/slice'
import { dismissInAppBrowser } from 'wallet/src/utils/linking'

describe(handleMoonpayReturnLink, () => {
  it('Navigates to the home screen activity tab when coming back from moonpay', () => {
    return expectSaga(handleMoonpayReturnLink)
      .provide([
        [put(forceFetchFiatOnRampTransactions), undefined],
        [call(navigate, MobileScreens.Home, { tab: HomeScreenTabIndex.Activity }), undefined],
        [call(dismissInAppBrowser), undefined],
      ])
      .silentRun()
  })
})
