import { createAction } from '@reduxjs/toolkit'
import { parseUri } from '@walletconnect/utils'
import { Alert } from 'react-native'
import { URL } from 'react-native-url-polyfill'
import { appSelect } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { handleMoonpayReturnLink } from 'src/features/deepLinking/handleMoonpayReturnLinkSaga'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLinkSaga'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLinkSaga'
import { openModal } from 'src/features/modals/modalSlice'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName, ShareableEntity } from 'src/features/telemetry/constants'
import { waitForWcWeb3WalletIsReady } from 'src/features/walletConnect/saga'
import { pairWithWalletConnectURI } from 'src/features/walletConnect/utils'
import { setDidOpenFromDeepLink } from 'src/features/walletConnect/walletConnectSlice'
import { WidgetType } from 'src/features/widgets/widgets'
import { Screens } from 'src/screens/Screens'
import { call, put, takeLatest } from 'typed-redux-saga'
import { UNISWAP_APP_HOSTNAME, uniswapUrls } from 'uniswap/src/constants/urls'
import { logger } from 'utilities/src/logger/logger'
import { fromUniswapWebAppLink } from 'wallet/src/features/chains/utils'
import {
  selectAccounts,
  selectActiveAccount,
  selectActiveAccountAddress,
  selectNonPendingAccounts,
} from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import i18n from 'wallet/src/i18n/i18n'
import { ModalName } from 'wallet/src/telemetry/constants'
import { buildCurrencyId, buildNativeCurrencyId } from 'wallet/src/utils/currencyId'
import { UNISWAP_APP_NATIVE_TOKEN, openUri } from 'wallet/src/utils/linking'

export interface DeepLink {
  url: string
  coldStart: boolean
}

export enum LinkSource {
  Widget = 'Widget',
  Share = 'Share',
}

export const UNISWAP_URL_SCHEME = 'uniswap://'
export const UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM = 'uniswap://wc?uri='
const UNISWAP_URL_SCHEME_WIDGET = 'uniswap://widget/'
export const UNISWAP_WALLETCONNECT_URL = uniswapUrls.appBaseUrl + '/wc?uri='
const WALLETCONNECT_URI_SCHEME = 'wc:' // https://eips.ethereum.org/EIPS/eip-1328

const NFT_ITEM_SHARE_LINK_HASH_REGEX = /^(#\/)?nfts\/asset\/(0x[a-fA-F0-9]{40})\/(\d+)$/
const NFT_COLLECTION_SHARE_LINK_HASH_REGEX = /^(#\/)?nfts\/collection\/(0x[a-fA-F0-9]{40})$/
const TOKEN_SHARE_LINK_HASH_REGEX = RegExp(
  // eslint-disable-next-line no-useless-escape
  `^(#\/)?tokens\/([\\w\\d]*)\/(0x[a-fA-F0-9]{40}|${UNISWAP_APP_NATIVE_TOKEN})$`
)
const ADDRESS_SHARE_LINK_HASH_REGEX = /^(#\/)?address\/(0x[a-fA-F0-9]{40})$/

export const openDeepLink = createAction<DeepLink>('deeplink/open')

export function* deepLinkWatcher() {
  yield* takeLatest(openDeepLink.type, handleDeepLink)
}

export function* handleUniswapAppDeepLink(path: string, url: string, linkSource: LinkSource) {
  // Navigate to the home page to ensure that a page isn't already open as a screen,
  // which causes the bottom sheet to break
  navigate(Screens.Home)

  // Handle NFT Item share (ex. https://app.uniswap.org/#/nfts/asset/0x.../123)
  if (NFT_ITEM_SHARE_LINK_HASH_REGEX.test(path)) {
    const [, , contractAddress, tokenId] = path.match(NFT_ITEM_SHARE_LINK_HASH_REGEX) || []
    if (!contractAddress || !tokenId) {
      return
    }
    yield* put(
      openModal({
        name: ModalName.Explore,
        initialState: {
          screen: Screens.NFTItem,
          params: {
            address: contractAddress,
            tokenId,
            isSpam: false,
          },
        },
      })
    )
    yield* call(sendMobileAnalyticsEvent, MobileEventName.ShareLinkOpened, {
      entity: ShareableEntity.NftItem,
      url,
    })
    return
  }

  // Handle NFT collection share (ex. https://app.uniswap.org/#/nfts/collection/0x...)
  if (NFT_COLLECTION_SHARE_LINK_HASH_REGEX.test(path)) {
    const [, , contractAddress] = path.match(NFT_COLLECTION_SHARE_LINK_HASH_REGEX) || []
    if (!contractAddress) {
      return
    }
    yield* put(
      openModal({
        name: ModalName.Explore,
        initialState: {
          screen: Screens.NFTCollection,
          params: {
            collectionAddress: contractAddress,
          },
        },
      })
    )
    yield* call(sendMobileAnalyticsEvent, MobileEventName.ShareLinkOpened, {
      entity: ShareableEntity.NftCollection,
      url,
    })
    return
  }

  // Handle Token share (ex. https://app.uniswap.org/#/tokens/ethereum/0x...)
  if (TOKEN_SHARE_LINK_HASH_REGEX.test(path)) {
    const [, , network, contractAddress] = path.match(TOKEN_SHARE_LINK_HASH_REGEX) || []
    const chainId = network && fromUniswapWebAppLink(network)
    if (!chainId || !contractAddress) {
      return
    }
    const currencyId =
      contractAddress === UNISWAP_APP_NATIVE_TOKEN
        ? buildNativeCurrencyId(chainId)
        : buildCurrencyId(chainId, contractAddress)
    yield* put(
      openModal({
        name: ModalName.Explore,
        initialState: {
          screen: Screens.TokenDetails,
          params: {
            currencyId,
          },
        },
      })
    )
    if (linkSource === LinkSource.Share) {
      yield* call(sendMobileAnalyticsEvent, MobileEventName.ShareLinkOpened, {
        entity: ShareableEntity.Token,
        url,
      })
    } else {
      yield* call(sendMobileAnalyticsEvent, MobileEventName.WidgetClicked, {
        widget_type: WidgetType.TokenPrice,
        url,
      })
    }
    return
  }

  // Handle Address share (ex. https://app.uniswap.org/#/address/0x...)
  if (ADDRESS_SHARE_LINK_HASH_REGEX.test(path)) {
    const [, , accountAddress] = path.match(ADDRESS_SHARE_LINK_HASH_REGEX) || []
    if (!accountAddress) {
      return
    }
    const accounts = yield* appSelect(selectNonPendingAccounts)
    const activeAccountAddress = yield* appSelect(selectActiveAccountAddress)
    if (accountAddress === activeAccountAddress) {
      return
    }

    const isInternal = Boolean(accounts?.[accountAddress])
    if (isInternal) {
      yield* put(setAccountAsActive(accountAddress))
    } else {
      yield* put(
        openModal({
          name: ModalName.Explore,
          initialState: {
            screen: Screens.ExternalProfile,
            params: {
              address: accountAddress,
            },
          },
        })
      )
    }
    yield* call(sendMobileAnalyticsEvent, MobileEventName.ShareLinkOpened, {
      entity: ShareableEntity.Wallet,
      url,
    })
    return
  }
}

// eslint-disable-next-line complexity
export function* handleDeepLink(action: ReturnType<typeof openDeepLink>) {
  const { coldStart } = action.payload
  try {
    const url = new URL(action.payload.url)
    const screen = url.searchParams.get('screen')
    const userAddress = url.searchParams.get('userAddress')
    const fiatOnRamp = url.searchParams.get('fiatOnRamp') === 'true'

    const activeAccount = yield* appSelect(selectActiveAccount)
    if (!activeAccount) {
      // For app.uniswap.org links it should open a browser with the link
      // instead of handling it inside the app
      if (url.hostname === UNISWAP_APP_HOSTNAME) {
        yield* call(openUri, action.payload.url, /* openExternalBrowser */ true)
      }
      // Skip handling any other deep links
      return
    }

    // Handle WC deep link via connections in the format uniswap://wc?uri=${WC_URI}
    // Ex: uniswap://wc?uri=wc:123@2?relay-protocol=irn&symKey=51e
    if (action.payload.url.startsWith(UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM)) {
      let wcUri = action.payload.url.split(UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM)[1]
      if (!wcUri) {
        return
      }
      // Decode URI to handle special characters like %3A => :
      wcUri = decodeURIComponent(wcUri)
      yield* call(handleWalletConnectDeepLink, wcUri)
      return
    }

    // Handle WC deep link via connections in the format uniswap://${WC_URI}
    // Ex: uniswap://wc:123@2?relay-protocol=irn&symKey=51e
    if (action.payload.url.startsWith(UNISWAP_URL_SCHEME + WALLETCONNECT_URI_SCHEME)) {
      let wcUri = action.payload.url.split(UNISWAP_URL_SCHEME)[1]
      if (!wcUri) {
        return
      }
      // Decode URI to handle special characters like %3A => :
      wcUri = decodeURIComponent(wcUri)
      yield* call(handleWalletConnectDeepLink, wcUri)
      return
    }

    // Handles deep links from Uniswap Widgets (ex. uniswap://widget/#/tokens/ethereum/0x...)
    if (action.payload.url.startsWith(UNISWAP_URL_SCHEME_WIDGET)) {
      yield* call(handleUniswapAppDeepLink, url.hash, action.payload.url, LinkSource.Widget)
      return
    }

    // Skip handling any non-WalletConnect uniswap:// URL scheme deep links for now for security reasons
    // Currently only used on WalletConnect Universal Link web page fallback button (https://uniswap.org/app/wc)
    if (action.payload.url.startsWith(UNISWAP_URL_SCHEME)) {
      // Set didOpenFromDeepLink so that `returnToPreviousApp()` is enabled during WalletConnect flows
      yield* put(setDidOpenFromDeepLink(true))
      return
    }

    /*
    Handle WC universal links connections in the format https://uniswap.org/app/wc?uri=wc:123
    Notice that we assume the URL has only one parameter, named uri, which is the WallectConnect URI.
    Any other parameter present in the URI is considered to be part of the WallectConnect URI.
    For example, in the URL below, symKey is a parameter of the WallectConnect URI.
    https://uniswap.org/app/wc?uri=wc:111f1ff289d1cc5a70ec5354779c6a82b3bde5ac72476f7f67326c38a4ce99f2@2?relay-protocol=irn&symKey=75e152d915a717da9f7bca3df23a0c65fcc4725d769f877ccfaa1f65270cded2
    */
    if (action.payload.url.startsWith(UNISWAP_WALLETCONNECT_URL)) {
      // Only initial session connections include `uri` param, signing requests only link to /wc and should be ignored
      const wcUri = action.payload.url.split(UNISWAP_WALLETCONNECT_URL).pop()
      if (!wcUri) {
        return
      }
      yield* call(handleWalletConnectDeepLink, decodeURIComponent(wcUri))
      return
    }

    // Handle plain WalletConnect URIs
    if (action.payload.url.startsWith(WALLETCONNECT_URI_SCHEME)) {
      const wcUri = decodeURIComponent(action.payload.url)
      yield* call(handleWalletConnectDeepLink, wcUri)
      return
    }

    if (screen && userAddress) {
      const validUserAddress = yield* call(parseAndValidateUserAddress, userAddress)
      yield* put(setAccountAsActive(validUserAddress))

      switch (screen) {
        case 'transaction':
          if (fiatOnRamp) {
            yield* call(handleMoonpayReturnLink)
          } else {
            yield* call(handleTransactionLink)
          }
          break
        case 'swap':
          yield* call(handleSwapLink, url)
          break
        default:
          throw new Error('Invalid or unsupported screen')
      }
    }

    if (url.hostname === UNISWAP_APP_HOSTNAME) {
      const urlParts = url.href.split(`${UNISWAP_APP_HOSTNAME}/`)
      const urlPath = urlParts.length >= 1 ? (urlParts[1] as string) : ''
      yield* call(handleUniswapAppDeepLink, urlPath, action.payload.url, LinkSource.Share)
      return
    }

    yield* call(sendMobileAnalyticsEvent, MobileEventName.DeepLinkOpened, {
      url: url.toString(),
      screen: screen ?? 'other',
      is_cold_start: coldStart,
    })
  } catch (error) {
    yield* call(logger.error, error, {
      tags: { file: 'handleDeepLinkSaga', function: 'handleDeepLink' },
    })
  }
}

export function* handleWalletConnectDeepLink(wcUri: string) {
  yield* call(waitForWcWeb3WalletIsReady)

  const wcUriVersion = parseUri(wcUri).version

  if (wcUriVersion === 1) {
    Alert.alert(
      i18n.t('walletConnect.error.unsupportedV1.title'),
      i18n.t('walletConnect.error.unsupportedV1.message'),
      [{ text: i18n.t('common.button.ok') }]
    )
    return
  }

  if (wcUriVersion === 2) {
    try {
      yield* call(pairWithWalletConnectURI, wcUri)
    } catch (error) {
      logger.error(error, {
        tags: { file: 'handleDeepLinkSaga', function: 'handleWalletConnectDeepLink' },
      })
      Alert.alert(
        i18n.t('walletConnect.error.general.title'),
        i18n.t('walletConnect.error.general.message')
      )
    }
  }

  // Set didOpenFromDeepLink so that `returnToPreviousApp()` is enabled during WalletConnect flows
  yield* put(setDidOpenFromDeepLink(true))
}

export function* parseAndValidateUserAddress(userAddress: string | null) {
  if (!userAddress) {
    throw new Error('No `userAddress` provided')
  }

  const userAccounts = yield* appSelect(selectAccounts)
  const matchingAccount = Object.values(userAccounts).find(
    (account) => account.address.toLowerCase() === userAddress.toLowerCase()
  )

  if (!matchingAccount) {
    throw new Error('User address supplied in path does not exist in wallet')
  }

  return matchingAccount.address
}
