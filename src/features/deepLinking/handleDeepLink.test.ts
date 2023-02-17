import { expectSaga } from 'redux-saga-test-plan'
import {
  handleDeepLink,
  parseAndValidateUserAddress,
} from 'src/features/deepLinking/handleDeepLink'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLink'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { account } from 'src/test/fixtures'
import { logger } from 'src/utils/logger'

const swapUrl = `https://uniswap.org/app?screen=swap&userAddress=${account.address}`
const transactionUrl = `https://uniswap.org/app?screen=transaction&userAddress=${account.address}`
const swapDeepLinkPayload = { url: swapUrl, coldStart: false }
const transactionDeepLinkPayload = { url: transactionUrl, coldStart: false }
const unsupportedScreenDeepLinkPayload = {
  url: `https://uniswap.org/app?screen=send&userAddress=${account.address}`,
  coldStart: false,
}

describe(handleDeepLink, () => {
  it('Routes to the swap deep link handler if screen=swap and userAddress is valid', () => {
    return expectSaga(handleDeepLink, { payload: swapDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
        },
      })
      .call(parseAndValidateUserAddress, account.address)
      .put(activateAccount(account.address))
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        url: swapDeepLinkPayload.url,
        screen: 'swap',
        is_cold_start: swapDeepLinkPayload.coldStart,
      })
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
      .call(handleTransactionLink)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        url: transactionDeepLinkPayload.url,
        screen: 'transaction',
        is_cold_start: transactionDeepLinkPayload.coldStart,
      })
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
      .call(
        logger.error,
        'handleDeepLink',
        'handleDeepLink',
        `Error handling deep link ${unsupportedScreenDeepLinkPayload.url}: Invalid or unsupported screen`
      )
      .silentRun()
  })

  it('Fails if the userAddress does not exist in the wallet', () => {
    return expectSaga(handleDeepLink, { payload: swapDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {},
        },
      })
      .call(
        logger.error,
        'handleDeepLink',
        'handleDeepLink',
        `Error handling deep link ${swapDeepLinkPayload.url}: User address supplied in path does not exist in wallet`
      )
      .silentRun()
  })
})
