import { createAction } from '@reduxjs/toolkit'
import { parseUri } from '@walletconnect/utils'
import { Alert } from 'react-native'
import { navigate } from 'src/app/navigation/rootNavigation'
import { parseScantasticParams } from 'src/components/Requests/ScanSheet/util'
import {
  getFormattedUwuLinkTxnRequest,
  isAllowedUwuLinkRequest,
  parseUwuLinkDataFromDeeplink,
} from 'src/components/Requests/Uwulink/utils'
import { DeepLinkAction, DeepLinkActionResult, parseDeepLinkUrl } from 'src/features/deepLinking/deepLinkUtils'
import { handleOffRampReturnLink } from 'src/features/deepLinking/handleOffRampReturnLinkSaga'
import { handleOnRampReturnLink } from 'src/features/deepLinking/handleOnRampReturnLinkSaga'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLinkSaga'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLinkSaga'
import { closeAllModals, openModal } from 'src/features/modals/modalSlice'
import { waitForWcWeb3WalletIsReady } from 'src/features/walletConnect/saga'
import { pairWithWalletConnectURI } from 'src/features/walletConnect/utils'
import { addRequest, setDidOpenFromDeepLink } from 'src/features/walletConnect/walletConnectSlice'
import { call, put, select, takeLatest } from 'typed-redux-saga'
import { fromUniswapWebAppLink } from 'uniswap/src/features/chains/utils'
import { DynamicConfigs, UwuLinkConfigKey } from 'uniswap/src/features/gating/configs'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { BACKEND_NATIVE_CHAIN_ADDRESS_STRING } from 'uniswap/src/features/search/utils'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import i18n from 'uniswap/src/i18n'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { UwULinkRequest } from 'uniswap/src/types/walletConnect'
import { WidgetType } from 'uniswap/src/types/widgets'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { ScantasticParams } from 'wallet/src/features/scantastic/types'
import { getContractManager, getProviderManager } from 'wallet/src/features/wallet/context'
import { selectAccounts, selectActiveAccount, selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'

interface DeepLink {
  url: string
  coldStart: boolean
}

export enum LinkSource {
  Widget = 'Widget',
  Share = 'Share',
}

const NFT_ITEM_SHARE_LINK_HASH_REGEX = /^(#\/)?nfts\/asset\/(0x[a-fA-F0-9]{40})\/(\d+)$/
const NFT_COLLECTION_SHARE_LINK_HASH_REGEX = /^(#\/)?nfts\/collection\/(0x[a-fA-F0-9]{40})$/
const TOKEN_SHARE_LINK_HASH_REGEX = RegExp(
  // eslint-disable-next-line no-useless-escape
  `^(#\/)?tokens\/([\\w\\d]*)\/(0x[a-fA-F0-9]{40}|${BACKEND_NATIVE_CHAIN_ADDRESS_STRING})$`,
)
const ADDRESS_SHARE_LINK_HASH_REGEX = /^(#\/)?address\/(0x[a-fA-F0-9]{40})$/

export const openDeepLink = createAction<DeepLink>('deeplink/open')

export function* deepLinkWatcher() {
  yield* takeLatest(openDeepLink.type, handleDeepLink)
}

export function* handleUniswapAppDeepLink(path: string, url: string, linkSource: LinkSource) {
  // Navigate to the home page to ensure that a page isn't already open as a screen,
  // which causes the bottom sheet to break
  navigate(MobileScreens.Home)

  // Handle NFT Item share (ex. https://app.uniswap.org/nfts/asset/0x.../123)
  if (NFT_ITEM_SHARE_LINK_HASH_REGEX.test(path)) {
    const [, , contractAddress, tokenId] = path.match(NFT_ITEM_SHARE_LINK_HASH_REGEX) || []
    if (!contractAddress || !tokenId) {
      return
    }
    yield* put(
      openModal({
        name: ModalName.Explore,
        initialState: {
          screen: MobileScreens.NFTItem,
          params: {
            address: contractAddress,
            tokenId,
            isSpam: false,
          },
        },
      }),
    )
    yield* call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
      entity: ShareableEntity.NftItem,
      url,
    })
    return
  }

  // Handle NFT collection share (ex. https://app.uniswap.org/nfts/collection/0x...)
  if (NFT_COLLECTION_SHARE_LINK_HASH_REGEX.test(path)) {
    const [, , contractAddress] = path.match(NFT_COLLECTION_SHARE_LINK_HASH_REGEX) || []
    if (!contractAddress) {
      return
    }
    yield* put(
      openModal({
        name: ModalName.Explore,
        initialState: {
          screen: MobileScreens.NFTCollection,
          params: {
            collectionAddress: contractAddress,
          },
        },
      }),
    )
    yield* call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
      entity: ShareableEntity.NftCollection,
      url,
    })
    return
  }

  // Handle Token share (ex. https://app.uniswap.org/tokens/ethereum/0x...)
  if (TOKEN_SHARE_LINK_HASH_REGEX.test(path)) {
    const [, , network, contractAddress] = path.match(TOKEN_SHARE_LINK_HASH_REGEX) || []
    const chainId = network && fromUniswapWebAppLink(network)
    if (!chainId || !contractAddress) {
      return
    }
    const currencyId =
      contractAddress === BACKEND_NATIVE_CHAIN_ADDRESS_STRING
        ? buildNativeCurrencyId(chainId)
        : buildCurrencyId(chainId, contractAddress)
    yield* put(
      openModal({
        name: ModalName.Explore,
        initialState: {
          screen: MobileScreens.TokenDetails,
          params: {
            currencyId,
          },
        },
      }),
    )
    if (linkSource === LinkSource.Share) {
      yield* call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
        entity: ShareableEntity.Token,
        url,
      })
    } else {
      yield* call(sendAnalyticsEvent, MobileEventName.WidgetClicked, {
        widget_type: WidgetType.TokenPrice,
        url,
      })
    }
    return
  }

  // Handle Address share (ex. https://app.uniswap.org/address/0x...)
  if (ADDRESS_SHARE_LINK_HASH_REGEX.test(path)) {
    const [, , accountAddress] = path.match(ADDRESS_SHARE_LINK_HASH_REGEX) || []
    if (!accountAddress) {
      return
    }
    const accounts = yield* select(selectAccounts)
    const activeAccountAddress = yield* select(selectActiveAccountAddress)
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
            screen: MobileScreens.ExternalProfile,
            params: {
              address: accountAddress,
            },
          },
        }),
      )
    }
    yield* call(sendAnalyticsEvent, MobileEventName.ShareLinkOpened, {
      entity: ShareableEntity.Wallet,
      url,
    })
    return
  }
}

// eslint-disable-next-line complexity
export function* handleDeepLink(action: ReturnType<typeof openDeepLink>) {
  try {
    const { coldStart } = action.payload
    const deepLinkAction = parseDeepLinkUrl(action.payload.url)
    const activeAccount = yield* select(selectActiveAccount)
    if (!activeAccount) {
      if (deepLinkAction.action === DeepLinkAction.UniswapWebLink) {
        yield* call(openUri, deepLinkAction.data.url.toString(), true)
        yield* _sendAnalyticsEvent(deepLinkAction, coldStart)
      }
      // If there is no active account, we don't want to handle the deep link
      return
    }

    switch (deepLinkAction.action) {
      case DeepLinkAction.UniswapWebLink: {
        yield* call(
          handleUniswapAppDeepLink,
          deepLinkAction.data.urlPath,
          deepLinkAction.data.url.href,
          LinkSource.Share,
        )
        break
      }
      case DeepLinkAction.WalletConnectAsParam:
      case DeepLinkAction.UniswapWalletConnect: {
        yield* call(handleWalletConnectDeepLink, deepLinkAction.data.wcUri)
        break
      }
      case DeepLinkAction.UniswapWidget: {
        yield* call(
          handleUniswapAppDeepLink,
          deepLinkAction.data.url.hash,
          deepLinkAction.data.url.toString(),
          LinkSource.Widget,
        )
        break
      }
      case DeepLinkAction.Scantastic: {
        yield* call(handleScantasticDeepLink, deepLinkAction.data.scantasticQueryParams)
        break
      }
      case DeepLinkAction.UwuLink: {
        yield* call(handleUwuLinkDeepLink, deepLinkAction.data.url.toString())
        break
      }
      case DeepLinkAction.TransactionScreen:
      case DeepLinkAction.ShowTransactionAfterFiatOnRamp:
      case DeepLinkAction.ShowTransactionAfterFiatOffRampScreen:
      case DeepLinkAction.SwapScreen: {
        const validUserAddress = yield* call(parseAndValidateUserAddress, deepLinkAction.data.userAddress)
        yield* put(setAccountAsActive(validUserAddress))
        switch (deepLinkAction.action) {
          case DeepLinkAction.TransactionScreen: {
            yield* call(handleTransactionLink)
            break
          }
          case DeepLinkAction.ShowTransactionAfterFiatOnRamp: {
            yield* call(handleOnRampReturnLink)
            break
          }
          case DeepLinkAction.ShowTransactionAfterFiatOffRampScreen: {
            yield* call(handleOffRampReturnLink, deepLinkAction.data.url)
            break
          }
          case DeepLinkAction.SwapScreen: {
            yield* call(handleSwapLink, deepLinkAction.data.url)
            break
          }
        }
        break
      }
      case DeepLinkAction.SkipNonWalletConnect: {
        // Set didOpenFromDeepLink so that `returnToPreviousApp()` is enabled during WalletConnect flows
        yield* put(setDidOpenFromDeepLink(true))
        break
      }
      case DeepLinkAction.UniversalWalletConnectLink: {
        yield* call(handleWalletConnectDeepLink, deepLinkAction.data.wcUri)
        break
      }
      case DeepLinkAction.WalletConnect: {
        yield* call(handleWalletConnectDeepLink, deepLinkAction.data.wcUri)
        break
      }
      case DeepLinkAction.FiatOnRampScreen: {
        const validUserAddress = yield* call(parseAndValidateUserAddress, deepLinkAction.data.userAddress)
        yield* put(setAccountAsActive(validUserAddress))
        yield* call(handleGoToFiatOnRampDeepLink)
        break
      }
      case DeepLinkAction.TokenDetails: {
        yield* put(closeAllModals())
        yield* call(handleGoToTokenDetailsDeepLink, deepLinkAction.data.currencyId)
        break
      }
      case DeepLinkAction.Unknown:
      case DeepLinkAction.Error: {
        break
      }
    }
    yield* _sendAnalyticsEvent(deepLinkAction, coldStart)
  } catch (error) {
    yield* call(logger.error, error, {
      tags: { file: 'handleDeepLinkSaga', function: 'handleDeepLink' },
      extra: { coldStart: action.payload.coldStart, url: action.payload.url },
    })
  }
}

function* _sendAnalyticsEvent(deepLinkAction: DeepLinkActionResult, coldStart: boolean) {
  yield* call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
    action: deepLinkAction.action,
    url: deepLinkAction.data.url.toString(),
    screen: deepLinkAction.data.screen ?? 'other',
    is_cold_start: coldStart,
    source: deepLinkAction.data.source ?? 'unknown',
  })
}

export function* handleGoToFiatOnRampDeepLink() {
  const disableForKorea = Statsig.checkGate(getFeatureFlagName(FeatureFlags.DisableFiatOnRampKorea))
  if (disableForKorea) {
    navigate(ModalName.KoreaCexTransferInfoModal)
  } else {
    yield* put(
      openModal({
        name: ModalName.FiatOnRampAggregator,
      }),
    )
  }
}

export function* handleGoToTokenDetailsDeepLink(currencyId: string) {
  yield* call(navigate, MobileScreens.TokenDetails, {
    currencyId,
  })
}

export function* handleWalletConnectDeepLink(wcUri: string) {
  yield* call(waitForWcWeb3WalletIsReady)

  const wcUriVersion = parseUri(wcUri).version

  if (wcUriVersion === 1) {
    Alert.alert(
      i18n.t('walletConnect.error.unsupportedV1.title'),
      i18n.t('walletConnect.error.unsupportedV1.message'),
      [{ text: i18n.t('common.button.ok') }],
    )
    return
  }

  if (wcUriVersion === 2) {
    try {
      yield* call(pairWithWalletConnectURI, wcUri)
    } catch (error) {
      logger.error(error, {
        tags: { file: 'handleDeepLinkSaga', function: 'handleWalletConnectDeepLink' },
        extra: { wcUri },
      })
      Alert.alert(i18n.t('walletConnect.error.general.title'), i18n.t('walletConnect.error.general.message'))
    }
  }

  // Set didOpenFromDeepLink so that `returnToPreviousApp()` is enabled during WalletConnect flows
  yield* put(setDidOpenFromDeepLink(true))
}

export function* parseAndValidateUserAddress(userAddress: string | null) {
  if (!userAddress) {
    throw new Error('No `userAddress` provided')
  }

  const userAccounts = yield* select(selectAccounts)
  const matchingAccount = Object.values(userAccounts).find(
    (account) => account.address.toLowerCase() === userAddress.toLowerCase(),
  )

  if (!matchingAccount) {
    throw new Error('User address supplied in path does not exist in wallet')
  }

  return matchingAccount.address
}

function* handleScantasticDeepLink(scantasticQueryParams: string): Generator {
  const params = parseScantasticParams(scantasticQueryParams)
  const scantasticEnabled = Statsig.checkGate(getFeatureFlagName(FeatureFlags.Scantastic))

  if (!params || !scantasticEnabled) {
    Alert.alert(i18n.t('walletConnect.error.scantastic.title'), i18n.t('walletConnect.error.scantastic.message'), [
      { text: i18n.t('common.button.ok') },
    ])
    return
  }

  yield* call(launchScantastic, params)
}

function* launchScantastic(params: ScantasticParams): Generator {
  yield* put(closeAllModals())
  yield* put(
    openModal({
      name: ModalName.Scantastic,
      initialState: {
        params,
      },
    }),
  )
}

function* handleUwuLinkDeepLink(uri: string): Generator {
  try {
    const decodedUri = decodeURIComponent(uri)
    const uwulinkData = parseUwuLinkDataFromDeeplink(decodedUri)
    const parsedUwulinkRequest: UwULinkRequest = JSON.parse(uwulinkData)

    const uwuLinkAllowList = getDynamicConfigValue(DynamicConfigs.UwuLink, UwuLinkConfigKey.Allowlist, {
      contracts: [],
      tokenRecipients: [],
    })

    const isAllowed = isAllowedUwuLinkRequest(parsedUwulinkRequest, uwuLinkAllowList)

    if (!isAllowed) {
      Alert.alert(i18n.t('walletConnect.error.uwu.title'), i18n.t('walletConnect.error.uwu.scan'), [
        {
          text: i18n.t('common.button.ok'),
        },
      ])
      return
    }

    const activeAccount = yield* select(selectActiveAccount)
    if (!activeAccount) {
      return
    }

    const providerManager = yield* call(getProviderManager)
    const contractManager = yield* call(getContractManager)

    const uwuLinkTxnRequest = yield* call(getFormattedUwuLinkTxnRequest, {
      request: parsedUwulinkRequest,
      activeAccount,
      allowList: {
        contracts: [],
        tokenRecipients: [],
      },
      providerManager,
      contractManager,
    })

    yield* put(addRequest(uwuLinkTxnRequest))
  } catch {
    Alert.alert(i18n.t('walletConnect.error.uwu.title'), i18n.t('walletConnect.error.uwu.scan'), [
      {
        text: i18n.t('common.button.ok'),
      },
    ])
    return
  }
}
