import { call } from '@redux-saga/core/effects'
import { URL } from 'react-native-url-polyfill'
import { expectSaga } from 'redux-saga-test-plan'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLink'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLink'
import { Screens } from 'src/screens/Screens'
import { account } from 'src/test/fixtures'

const formTransactionUrl = (userAddress?: Address, txHash?: string) =>
  new URL(
    `uniswap://?screen=transaction
&userAddress=${userAddress}
&txHash=${txHash}`.trim()
  )

const txHash = '0x123'
const transactionUrl = formTransactionUrl(account.address, txHash)
const invalidTransactionUrl = formTransactionUrl(account.address)

describe(handleSwapLink, () => {
  it('Navigates to the notification screen with the txHash as a param if provided', () => {
    return expectSaga(handleTransactionLink, transactionUrl)
      .provide([[call(navigate, Screens.Notifications, { txHash }), undefined]])
      .silentRun()
  })

  it('Navigates to the notification screen without any params if non provided', () => {
    return expectSaga(handleSwapLink, invalidTransactionUrl)
      .provide([[call(navigate, Screens.Notifications), undefined]])
      .silentRun()
  })
})
