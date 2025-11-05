import { call, delay } from 'redux-saga/effects'
import { expectSaga, RunResult } from 'redux-saga-test-plan'
import { navigationRef } from 'src/app/navigation/navigationRef'
import { navigate } from 'src/app/navigation/rootNavigation'
import { DeepLinkAction } from 'src/features/deepLinking/deepLinkUtils'
import {
  handleDeepLink,
  handleGoToTokenDetailsDeepLink,
  handleWalletConnectDeepLink,
  ONRAMP_DEEPLINK_DELAY,
  parseAndValidateUserAddress,
} from 'src/features/deepLinking/handleDeepLinkSaga'
import { handleOnRampReturnLink } from 'src/features/deepLinking/handleOnRampReturnLinkSaga'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLinkSaga'
import { handleUniswapAppDeepLink } from 'src/features/deepLinking/handleUniswapAppDeepLink'
import { LinkSource } from 'src/features/deepLinking/types'
import { openModal } from 'src/features/modals/modalSlice'
import { waitForWcWeb3WalletIsReady } from 'src/features/walletConnect/walletConnectClient'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  SAMPLE_CURRENCY_ID_1,
  SAMPLE_CURRENCY_ID_2,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
} from 'uniswap/src/test/fixtures'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

jest.mock('@walletconnect/utils', () => ({
  parseUri: jest.fn(() => ({
    version: 2,
  })),
}))
jest.mock('expo-web-browser', () => ({
  dismissBrowser: jest.fn(),
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: {
    FULL_SCREEN: 'fullScreen',
  },
}))
jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  getStatsigClient: jest.fn(() => ({
    checkGate: jest.fn(() => false), // Always return false to avoid Korea gate redirects
  })),
  getFeatureFlag: jest.fn(() => false), // Default to false for feature flags
}))

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
  userSettings: {
    isTestnetModeEnabled: false,
    currentLanguage: 'en-US',
    currentCurrency: 'USD',
    hideSmallBalances: false,
    hideSpamTokens: true,
    hapticsEnabled: true,
  },
}

describe(handleDeepLink, () => {
  beforeAll(() => {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true)
    jest.spyOn(navigationRef, 'navigate').mockReturnValue(undefined)
    jest.spyOn(navigationRef, 'getState').mockReturnValue({
      key: 'root',
      index: 0,
      routes: [{ name: MobileScreens.Home, key: 'home' }],
      routeNames: [MobileScreens.Home],
      history: [],
      type: 'stack',
      stale: false,
    })
    jest.spyOn(navigationRef, 'canGoBack').mockReturnValue(false)
  })

  it('Routes to the swap deep link handler if screen=swap and userAddress is valid', () => {
    const payload = swapDeepLinkPayload
    return expectSaga(handleDeepLink, { payload, type: '' })
      .withState(stateWithActiveAccountAddress)
      .call(parseAndValidateUserAddress, account.address)
      .put(setAccountAsActive(account.address))
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.SwapScreen,
        url: payload.url,
        screen: 'swap',
        is_cold_start: payload.coldStart,
        source: 'unknown',
      })
      .silentRun()
  })

  it('Routes to the transaction deep link handler if screen=transaction and userAddress is valid', () => {
    const payload = transactionDeepLinkPayload
    return expectSaga(handleDeepLink, { payload, type: '' })
      .withState(stateWithActiveAccountAddress)
      .call(handleTransactionLink)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.TransactionScreen,
        url: payload.url,
        screen: 'transaction',
        is_cold_start: payload.coldStart,
        source: 'unknown',
      })
      .silentRun()
  })

  it('Fails if the screen param is not supported', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)

    const payload = unsupportedScreenDeepLinkPayload
    return expectSaga(handleDeepLink, { payload, type: '' })
      .withState(stateWithActiveAccountAddress)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.Unknown,
        url: payload.url,
        screen: 'send',
        is_cold_start: payload.coldStart,
        source: 'unknown',
      })
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
    const payload = { url: wcUniversalLinkUrl, coldStart: false }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[call(waitForWcWeb3WalletIsReady), undefined]])
      .call(handleWalletConnectDeepLink, wcUri)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.UniversalWalletConnectLink,
        url: payload.url,
        screen: 'other',
        is_cold_start: payload.coldStart,
        source: 'unknown',
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles WalletConnect connection using Uniswap URL scheme with WalletConnect URI as query param', () => {
    const payload = { url: wcAsParamInUniwapScheme, coldStart: false }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[call(waitForWcWeb3WalletIsReady), undefined]])
      .call(handleWalletConnectDeepLink, wcUri)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.WalletConnectAsParam,
        url: payload.url,
        screen: 'other',
        is_cold_start: payload.coldStart,
        source: 'unknown',
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles WalletConnect connection using Uniswap URL scheme with WalletConnect URI', () => {
    const payload = { url: wcInUniwapScheme, coldStart: false }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[call(waitForWcWeb3WalletIsReady), undefined]])
      .call(handleWalletConnectDeepLink, wcUri)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.UniswapWalletConnect,
        url: payload.url,
        screen: 'other',
        is_cold_start: payload.coldStart,
        source: 'unknown',
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles WalletConnect connection using WalletConnect URI', () => {
    const payload = { url: wcUri, coldStart: false }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[call(waitForWcWeb3WalletIsReady), undefined]])
      .call(handleWalletConnectDeepLink, wcUri)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.WalletConnect,
        url: payload.url,
        screen: 'other',
        is_cold_start: payload.coldStart,
        source: 'unknown',
      })
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
    const pathUrl = `${UNISWAP_WEB_URL}/${path}`
    const hashedUrl = `${UNISWAP_WEB_URL}/#/${path}`
    const expectedModalState = {
      address: SAMPLE_SEED_ADDRESS_1,
      tokenId: '123',
      isSpam: false,
    }

    await expectSaga(handleDeepLink, {
      payload: {
        url: hashedUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, {
        path: `#/${path}`,
        url: hashedUrl,
        linkSource: LinkSource.Share,
      })
      .call(navigate, MobileScreens.NFTItem, expectedModalState)
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
      .call(handleUniswapAppDeepLink, {
        path,
        url: pathUrl,
        linkSource: LinkSource.Share,
      })
      .call(navigate, MobileScreens.NFTItem, expectedModalState)
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share NFT Collection Universal Link', async () => {
    const path = `nfts/collection/${SAMPLE_SEED_ADDRESS_1}`
    const pathUrl = `${UNISWAP_WEB_URL}/${path}`
    const hashedUrl = `${UNISWAP_WEB_URL}/#/${path}`
    const expectedModalState = {
      collectionAddress: SAMPLE_SEED_ADDRESS_1,
    }

    await expectSaga(handleDeepLink, {
      payload: {
        url: hashedUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, {
        path: `#/${path}`,
        url: hashedUrl,
        linkSource: LinkSource.Share,
      })
      .call(navigate, MobileScreens.NFTCollection, expectedModalState)
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
      .call(handleUniswapAppDeepLink, {
        path,
        url: pathUrl,
        linkSource: LinkSource.Share,
      })
      .call(navigate, MobileScreens.NFTCollection, expectedModalState)
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share Token Item Universal Link', async () => {
    const path = `tokens/ethereum/${SAMPLE_SEED_ADDRESS_1}`
    const pathUrl = `${UNISWAP_WEB_URL}/${path}`
    const hashedUrl = `${UNISWAP_WEB_URL}/#/${path}`
    const expectedModalState = {
      currencyId: `1-${SAMPLE_SEED_ADDRESS_1}`,
    }

    await expectSaga(handleDeepLink, {
      payload: {
        url: hashedUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, {
        path: `#/${path}`,
        url: hashedUrl,
        linkSource: LinkSource.Share,
      })
      .call(navigate, MobileScreens.TokenDetails, expectedModalState)
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
      .call(handleUniswapAppDeepLink, {
        path,
        url: pathUrl,
        linkSource: LinkSource.Share,
      })
      .call(navigate, MobileScreens.TokenDetails, expectedModalState)
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share currently active Account Address Universal Link', () => {
    const hash = `#/address/${account.address}`
    const url = `${UNISWAP_WEB_URL}/${hash}`
    return expectSaga(handleDeepLink, {
      payload: {
        url,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, {
        path: hash,
        url,
        linkSource: LinkSource.Share,
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share already added Account Address Universal Link', () => {
    const hash = `#/address/${SAMPLE_SEED_ADDRESS_2}`
    const url = `${UNISWAP_WEB_URL}/${hash}`
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
      .call(handleUniswapAppDeepLink, {
        path: hash,
        url,
        linkSource: LinkSource.Share,
      })
      .put(setAccountAsActive(SAMPLE_SEED_ADDRESS_2))
      .returns(undefined)
      .silentRun()
  })

  it('Handles Share external Account Address Universal Link', async () => {
    const path = `address/${SAMPLE_SEED_ADDRESS_2}`
    const pathUrl = `${UNISWAP_WEB_URL}/${path}`
    const hashedUrl = `${UNISWAP_WEB_URL}/#/${path}`
    const expectedModalState = {
      address: SAMPLE_SEED_ADDRESS_2,
    }

    await expectSaga(handleDeepLink, {
      payload: {
        url: hashedUrl,
        coldStart: false,
      },
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleUniswapAppDeepLink, {
        path: `#/${path}`,
        url: hashedUrl,
        linkSource: LinkSource.Share,
      })
      .call(navigate, MobileScreens.ExternalProfile, expectedModalState)
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
      .call(handleUniswapAppDeepLink, {
        path,
        url: pathUrl,
        linkSource: LinkSource.Share,
      })
      .call(navigate, MobileScreens.ExternalProfile, expectedModalState)
      .returns(undefined)
      .silentRun()
  })

  it('Handles show transaction after fiat onramp', () => {
    const payload = {
      url: `https://uniswap.org/app?screen=transaction&fiatOnRamp=true&userAddress=${account.address}`,
      coldStart: false,
    }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleOnRampReturnLink)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.ShowTransactionAfterFiatOnRamp,
        url: payload.url,
        screen: 'transaction',
        is_cold_start: payload.coldStart,
        source: 'unknown',
      })
      .returns(undefined)
      .silentRun()
  })
  it('Handles show transaction after fiat off ramp', () => {
    const payload = {
      url: `https://uniswap.org/app?screen=transaction&fiatOffRamp=true&userAddress=${account.address}`,
      coldStart: false,
    }
    return (
      expectSaga(handleDeepLink, {
        payload,
        type: '',
      })
        .withState(stateWithActiveAccountAddress)
        // FIXME: The URL object is the same URL but a different instance
        // .call(handleOffRampReturnLink, new URL(payload.url))
        .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
          action: DeepLinkAction.ShowTransactionAfterFiatOffRampScreen,
          url: payload.url,
          screen: 'transaction',
          is_cold_start: payload.coldStart,
          source: 'unknown',
        })
        .returns(undefined)
        .silentRun()
    )
  })
  it('Handles show transaction', () => {
    const payload = {
      url: `https://uniswap.org/app?screen=transaction&userAddress=${account.address}`,
      coldStart: false,
    }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleTransactionLink)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.TransactionScreen,
        url: payload.url,
        screen: 'transaction',
        is_cold_start: payload.coldStart,
        source: 'unknown',
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles showing token details for a token', () => {
    const payload = {
      url: `uniswap://app/tokendetails?currencyId=${SAMPLE_CURRENCY_ID_1}&source=push`,
      coldStart: false,
    }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .call(handleGoToTokenDetailsDeepLink, SAMPLE_CURRENCY_ID_1)
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.TokenDetails,
        url: payload.url,
        screen: 'other',
        is_cold_start: payload.coldStart,
        source: 'push',
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles showing fiat onramp', () => {
    const payload = {
      url: `uniswap://app/fiatonramp?userAddress=${account.address}&source=push`,
      coldStart: false,
    }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[delay(ONRAMP_DEEPLINK_DELAY), undefined]])
      .call(parseAndValidateUserAddress, account.address)
      .put(setAccountAsActive(account.address))
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.FiatOnRampScreen,
        url: payload.url,
        screen: 'other',
        is_cold_start: payload.coldStart,
        source: 'push',
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles MoonPay exclusive fiat onramp deeplink', () => {
    const payload = {
      url: `uniswap://app/fiatonramp?moonpayOnly=true&source=moonpay-ad`,
      coldStart: false,
    }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[delay(ONRAMP_DEEPLINK_DELAY), undefined]])
      .put(
        openModal({
          name: ModalName.FiatOnRampAggregator,
          initialState: {
            providers: ['MOONPAY'],
            prefilledAmount: undefined,
            currencyCode: undefined,
          },
        }),
      )
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.FiatOnRampScreen,
        url: payload.url,
        screen: 'other',
        is_cold_start: payload.coldStart,
        source: 'moonpay-ad',
      })
      .returns(undefined)
      .silentRun()
  })

  it('Handles MoonPay exclusive fiat onramp deeplink with token and amount', () => {
    const payload = {
      url: `uniswap://app/fiatonramp?moonpayOnly=true&moonpayCurrencyCode=eth&amount=100&source=moonpay-ad`,
      coldStart: false,
    }
    return expectSaga(handleDeepLink, {
      payload,
      type: '',
    })
      .withState(stateWithActiveAccountAddress)
      .provide([[delay(ONRAMP_DEEPLINK_DELAY), undefined]])
      .put(
        openModal({
          name: ModalName.FiatOnRampAggregator,
          initialState: {
            providers: ['MOONPAY'],
            prefilledAmount: '100',
            currencyCode: 'eth',
          },
        }),
      )
      .call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
        action: DeepLinkAction.FiatOnRampScreen,
        url: payload.url,
        screen: 'other',
        is_cold_start: payload.coldStart,
        source: 'moonpay-ad',
      })
      .returns(undefined)
      .silentRun()
  })
})
