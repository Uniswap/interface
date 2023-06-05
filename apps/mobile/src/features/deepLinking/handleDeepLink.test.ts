import { expectSaga } from 'redux-saga-test-plan'
import {
  handleDeepLink,
  handleWalletConnectDeepLink,
  parseAndValidateUserAddress,
} from 'src/features/deepLinking/handleDeepLink'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLink'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { account } from 'src/test/fixtures'
import { logger } from 'wallet/src/features/logger/logger'
import { activateAccount } from 'wallet/src/features/wallet/slice'

const swapUrl = `https://uniswap.org/app?screen=swap&userAddress=${account.address}`
const transactionUrl = `https://uniswap.org/app?screen=transaction&userAddress=${account.address}`
const swapDeepLinkPayload = { url: swapUrl, coldStart: false }
const transactionDeepLinkPayload = { url: transactionUrl, coldStart: false }
const unsupportedScreenDeepLinkPayload = {
  url: `https://uniswap.org/app?screen=send&userAddress=${account.address}`,
  coldStart: false,
}

const wcUniversalLinkUrl = `https://uniswap.org/app/wc?uri=wc:123`
const wcUrlSchemeUrl = `uniswap://wc?uri=wc:123`
const invalidUrlSchemeUrl = `uniswap://invalid?param=pepe`

describe(handleDeepLink, () => {
  it('Routes to the swap deep link handler if screen=swap and userAddress is valid', () => {
    return expectSaga(handleDeepLink, { payload: swapDeepLinkPayload, type: '' })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
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
          activeAccountAddress: account.address,
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
          activeAccountAddress: account.address,
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
          activeAccountAddress: null,
        },
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles WalletConnect Universal Link connection', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: wcUniversalLinkUrl, coldStart: false },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleWalletConnectDeepLink, 'wc:123')
      .returns(undefined)

      .silentRun()
  })

  it('Handles WalletConnect URL scheme connection', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: wcUrlSchemeUrl, coldStart: false },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleWalletConnectDeepLink, 'wc:123')
      .returns(undefined)
      .silentRun()
  })

  it('Fails arbitrary URL scheme deep link', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: invalidUrlSchemeUrl, coldStart: false },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
          },
          activeAccountAddress: account.address,
        },
      })

      .returns(undefined)
      .silentRun()
  })
})
