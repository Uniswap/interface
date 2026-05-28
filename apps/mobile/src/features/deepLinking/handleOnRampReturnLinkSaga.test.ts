import { call, put } from '@redux-saga/core/effects'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleOnRampReturnLink } from 'src/features/deepLinking/handleOnRampReturnLinkSaga'
import { dismissInAppBrowser } from 'src/utils/linking'
import { forceFetchFiatOnRampTransactions } from 'uniswap/src/features/transactions/slice'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

describe(handleOnRampReturnLink, () => {
  it('Navigates to the activity screen when coming back from on-ramp widget', () => {
    return expectSaga(handleOnRampReturnLink)
      .provide([
        [put(forceFetchFiatOnRampTransactions), undefined],
        [call(navigate, MobileScreens.Activity), undefined],
        [call(dismissInAppBrowser), undefined],
      ])
      .silentRun()
  })
})
