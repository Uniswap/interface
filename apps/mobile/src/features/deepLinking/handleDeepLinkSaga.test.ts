import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { navigationRef } from 'src/app/navigation/NavigationContainer'
import {
  handleDeepLink,
  handleUniswapAppDeepLink,
  handleWalletConnectDeepLink,
  LinkSource,
  parseAndValidateUserAddress,
} from 'src/features/deepLinking/handleDeepLinkSaga'

import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLinkSaga'
import { openModal, OpenModalParams } from 'src/features/modals/modalSlice'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { waitForWcWeb3WalletIsReady } from 'src/features/walletConnect/saga'
import { Screens } from 'src/screens/Screens'
import { UNISWAP_APP_HOSTNAME } from 'uniswap/src/constants/urls'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { ModalName } from 'wallet/src/telemetry/constants'
import {
  SAMPLE_CURRENCY_ID_1,
  SAMPLE_CURRENCY_ID_2,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
  signerMnemonicAccount,
} from 'wallet/src/test/fixtures'

const account = signerMnemonicAccount()

const swapUrl = `https://uniswap.org/app?screen=swap&userAddress=${account.address}&inputCurrencyId=${SAMPLE_CURRENCY_ID_1}&outputCurrencyId=${SAMPLE_CURRENCY_ID_2}&currencyField=INPUT`
const transactionUrl = `https://uniswap.org/app?screen=transaction&userAddress=${account.address}`
const swapDeepLinkPayload = { url: swapUrl, coldStart: false }
const transactionDeepLinkPayload = { url: transactionUrl, coldStart: false }
const unsupportedScreenDeepLinkPayload = {
  url: `https://uniswap.org/app?screen=send&userAddress=${account.address}`,
  coldStart: false,
}

// WalletConnect URI has its own query parameters that should not be dropped
const wcUri = 'wc:af098@2?relay-protocol=irn&symKey=51e'
export const wcUniversalLinkUrl = `https://uniswap.org/app/wc?uri=${wcUri}`
export const wcAsParamInUniwapScheme = `uniswap://wc?uri=${wcUri}`
export const wcInUniwapScheme = `uniswap://${wcUri}`
const invalidUrlSchemeUrl = `uniswap://invalid?param=pepe`

const stateWithActiveAccountAddress = {
  wallet: {
    accounts: {
      [account.address]: account,
    },
    activeAccountAddress: account.address,
  },
}

describe(handleDeepLink, () => {
  beforeAll(() => {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true)
    jest.spyOn(navigationRef, 'navigate').mockReturnValue(undefined)
  })

  it('Routes to the swap deep link handler if screen=swap and userAddress is valid', () => {
    return expectSaga(handleDeepLink, { payload: swapDeepLinkPayload, type: '' })
      .withState(stateWithActiveAccountAddress)
      .call(parseAndValidateUserAddress, account.address)
      .put(setAccountAsActive(account.address))
      .call(sendMobileAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        url: swapDeepLinkPayload.url,
        screen: 'swap',
        is_cold_start: swapDeepLinkPayload.coldStart,
      })
      .silentRun()
  })

  it('Routes to the transaction deep link handler if screen=transaction and userAddress is valid', () => {
    return expectSaga(handleDeepLink, { payload: transactionDeepLinkPayload, type: '' })
      .withState(stateWithActiveAccountAddress)
      .call(handleTransactionLink)
      .call(sendMobileAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        url: transactionDeepLinkPayload.url,
        screen: 'transaction',
        is_cold_start: transactionDeepLinkPayload.coldStart,
      })
      .silentRun()
  })

  it('Fails if the screen param is not supported', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    return expectSaga(handleDeepLink, { payload: unsupportedScreenDeepLinkPayload, type: '' })
      .withState(stateWithActiveAccountAddress)
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

  it('Handles WalletConnect connection using Universal Link URL', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: wcUniversalLinkUrl, coldStart: false },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[call(waitForWcWeb3WalletIsReady), undefined]])
      .call(handleWalletConnectDeepLink, wcUri)
      .returns(undefined)
      .silentRun()
  })

  it('Handles WalletConnect connection using Uniswap URL scheme with WalletConnect URI as query param', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: wcAsParamInUniwapScheme, coldStart: false },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[call(waitForWcWeb3WalletIsReady), undefined]])
      .call(handleWalletConnectDeepLink, wcUri)
      .returns(undefined)
      .silentRun()
  })

  it('Handles WalletConnect connection using Uniswap URL scheme with WalletConnect URI', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: wcInUniwapScheme, coldStart: false },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[call(waitForWcWeb3WalletIsReady), undefined]])
      .call(handleWalletConnectDeepLink, wcUri)
      .returns(undefined)
      .silentRun()
  })

  it('Handles WalletConnect connection using WalletConnect URI', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: wcUri, coldStart: false },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[call(waitForWcWeb3WalletIsReady), undefined]])
      .call(handleWalletConnectDeepLink, wcUri)
      .returns(undefined)
      .silentRun()
  })

  it('Fails arbitrary URL scheme deep link', () => {
    return expectSaga(handleDeepLink, {
      payload: { url: invalidUrlSchemeUrl, coldStart: false },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share NFT Item Universal Link', async () => {
    const path = `nfts/asset/${SAMPLE_SEED_ADDRESS_1}/123`
    const pathUrl = `https://${UNISWAP_APP_HOSTNAME}/${path}`
    const hashedUrl = `https://${UNISWAP_APP_HOSTNAME}/#/${path}`
    const expectedModal: OpenModalParams = {
      name: ModalName.Explore,
      initialState: {
        screen: Screens.NFTItem,
        params: {
          address: SAMPLE_SEED_ADDRESS_1,
          tokenId: '123',
          isSpam: false,
        },
      },
    }

    await expectSaga(handleDeepLink, {
      payload: {
        url: hashedUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, `#/${path}`, hashedUrl, LinkSource.Share)
      .put(openModal(expectedModal))
      .returns(undefined)
      .silentRun()

    await expectSaga(handleDeepLink, {
      payload: {
        url: pathUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, path, pathUrl, LinkSource.Share)
      .put(openModal(expectedModal))
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share NFT Collection Universal Link', async () => {
    const path = `nfts/collection/${SAMPLE_SEED_ADDRESS_1}`
    const pathUrl = `https://${UNISWAP_APP_HOSTNAME}/${path}`
    const hashedUrl = `https://${UNISWAP_APP_HOSTNAME}/#/${path}`
    const expectedModal: OpenModalParams = {
      name: ModalName.Explore,
      initialState: {
        screen: Screens.NFTCollection,
        params: {
          collectionAddress: SAMPLE_SEED_ADDRESS_1,
        },
      },
    }

    await expectSaga(handleDeepLink, {
      payload: {
        url: hashedUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, `#/${path}`, hashedUrl, LinkSource.Share)
      .put(openModal(expectedModal))
      .returns(undefined)
      .silentRun()

    await expectSaga(handleDeepLink, {
      payload: {
        url: pathUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, path, pathUrl, LinkSource.Share)
      .put(openModal(expectedModal))
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share Token Item Universal Link', async () => {
    const path = `tokens/ethereum/${SAMPLE_SEED_ADDRESS_1}`
    const pathUrl = `https://${UNISWAP_APP_HOSTNAME}/${path}`
    const hashedUrl = `https://${UNISWAP_APP_HOSTNAME}/#/${path}`
    const expectedModal: OpenModalParams = {
      name: ModalName.Explore,
      initialState: {
        screen: Screens.TokenDetails,
        params: {
          currencyId: `1-${SAMPLE_SEED_ADDRESS_1}`,
        },
      },
    }

    await expectSaga(handleDeepLink, {
      payload: {
        url: hashedUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, `#/${path}`, hashedUrl, LinkSource.Share)
      .put(openModal(expectedModal))
      .returns(undefined)
      .silentRun()

    await expectSaga(handleDeepLink, {
      payload: {
        url: pathUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, path, pathUrl, LinkSource.Share)
      .put(openModal(expectedModal))
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share currently active Account Address Universal Link', () => {
    const hash = `#/address/${account.address}`
    const url = `https://${UNISWAP_APP_HOSTNAME}/${hash}`
    return expectSaga(handleDeepLink, {
      payload: {
        url,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, hash, url, LinkSource.Share)
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share already added Account Address Universal Link', () => {
    const hash = `#/address/${SAMPLE_SEED_ADDRESS_2}`
    const url = `https://${UNISWAP_APP_HOSTNAME}/${hash}`
    return expectSaga(handleDeepLink, {
      payload: {
        url,
        coldStart: false,
      },
      type: '',
    })
      .withState({
        wallet: {
          accounts: {
            [account.address]: account,
            [SAMPLE_SEED_ADDRESS_2]: account,
          },
          activeAccountAddress: account.address,
        },
      })
      .call(handleUniswapAppDeepLink, hash, url, LinkSource.Share)
      .put(setAccountAsActive(SAMPLE_SEED_ADDRESS_2))
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share external Account Address Universal Link', async () => {
    const path = `address/${SAMPLE_SEED_ADDRESS_2}`
    const pathUrl = `https://${UNISWAP_APP_HOSTNAME}/${path}`
    const hashedUrl = `https://${UNISWAP_APP_HOSTNAME}/#/${path}`
    const expectedModal: OpenModalParams = {
      name: ModalName.Explore,
      initialState: {
        screen: Screens.ExternalProfile,
        params: {
          address: SAMPLE_SEED_ADDRESS_2,
        },
      },
    }

    await expectSaga(handleDeepLink, {
      payload: {
        url: hashedUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, `#/${path}`, hashedUrl, LinkSource.Share)
      .put(openModal(expectedModal))
      .returns(undefined)
      .silentRun()

    await expectSaga(handleDeepLink, {
      payload: {
        url: pathUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, path, pathUrl, LinkSource.Share)
      .put(openModal(expectedModal))
      .returns(undefined)
      .silentRun()
  })
})
