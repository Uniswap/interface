import { URL } from 'react-native-url-polyfill'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import {
  handleDeepLink,
  parseAndValidateUserAddress,
} from 'src/features/deepLinking/handleDeepLink'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLink'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLink'
import { logEvent } from 'src/features/telemetry'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { account } from 'src/test/fixtures'

const swapUrl = `https://uniswap.org/app?screen=swap&userAddress=${account.address}`
const transactionUrl = `https://uniswap.org/app?screen=transaction&userAddress=${account.address}`
const swapUrlObj = new URL(swapUrl)
const swapDeepLinkPayload = { url: swapUrl, coldStart: false }
const transactionDeepLinkPayload = { url: transactionUrl, coldStart: false }
const unsupportedScreenDeepLinkPayload = {
  url: `https://uniswap.org/app?screen=send&userAddress=${account.address}`,
  coldStart: false,
}

describe(handleDeepLink, () => {
  it('Routes to the swap deep link handler if screen=swap and userAddress is valid', async () => {
    await expectSaga(handleDeepLink, { payload: swapDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
        },
      })
      .provide([
        [call(handleSwapLink, swapUrlObj), undefined],
        [
          call(logEvent, 'deeplink', { coldStart: swapDeepLinkPayload.coldStart, success: true }),
          undefined,
        ],
      ])
      .call(parseAndValidateUserAddress, account.address)
      .put(activateAccount(account.address))
      .silentRun()
  })

  it('Routes to the transaction deep link handler if screen=transaction and userAddress is valid', () => {
    return expectSaga(handleDeepLink, { payload: transactionDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
        },
      })
      .provide([
        [call(handleTransactionLink), undefined],
        [
          call(logEvent, 'deeplink', {
            coldStart: transactionDeepLinkPayload.coldStart,
            success: true,
          }),
          undefined,
        ],
      ])
      .call(parseAndValidateUserAddress, account.address)
      .put(activateAccount(account.address))
      .silentRun()
  })

  it('Fails if the screen param is not supported', () => {
    return expectSaga(handleDeepLink, { payload: unsupportedScreenDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
        },
      })
      .provide([
        [
          call(logEvent, 'deeplink', {
            coldStart: unsupportedScreenDeepLinkPayload.coldStart,
            success: false,
          }),
          undefined,
        ],
      ])
      .call(parseAndValidateUserAddress, account.address)
      .put(activateAccount(account.address))
      .silentRun()
  })

  it('Fails if the userAddress does not exist in the wallet', () => {
    return expectSaga(handleDeepLink, { payload: swapDeepLinkPayload, type: '' })
      .provide([
        [
          call(logEvent, 'deeplink', { coldStart: swapDeepLinkPayload.coldStart, success: false }),
          undefined,
        ],
      ])
      .silentRun()
  })
})
