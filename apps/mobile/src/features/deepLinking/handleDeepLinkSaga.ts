import { createAction } from '@reduxjs/toolkit'
import { areEvmAddressesEqual } from '@universe/chains'
import { isAndroid } from '@universe/environment'
import { FeatureFlags, getFeatureFlagName, getOverrideAdapter, getStatsigClient } from '@universe/gating'
import { parseUri } from '@walletconnect/utils'
import { Alert } from 'react-native'
import { navigate } from 'src/app/navigation/rootNavigation'
import { parseScantasticParams } from 'src/components/Requests/ScanSheet/util'
import { getConfig } from 'src/config'
import {
  DeepLinkAction,
  DeepLinkActionResult,
  PayloadWithFiatOnRampParams,
  parseDeepLinkUrl,
} from 'src/features/deepLinking/deepLinkUtils'
import { handleOffRampReturnLink } from 'src/features/deepLinking/handleOffRampReturnLinkSaga'
import { handleOnRampReturnLink } from 'src/features/deepLinking/handleOnRampReturnLinkSaga'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLinkSaga'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLinkSaga'
import { handleUniswapAppDeepLink } from 'src/features/deepLinking/handleUniswapAppDeepLink'
import { parseSwapLinkMobileFormatOrThrow } from 'src/features/deepLinking/parseSwapLink'
import { LinkSource } from 'src/features/deepLinking/types'
import { closeAllModals, openModal } from 'src/features/modals/modalSlice'
import { pairWithWalletConnectURI } from 'src/features/walletConnect/utils'
import { waitForWcWeb3WalletIsReady } from 'src/features/walletConnect/walletConnectClient'
import { setDidOpenFromDeepLink } from 'src/features/walletConnect/walletConnectSlice'
import { call, delay, put, select, takeLatest } from 'typed-redux-saga'
import { MobileEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import i18n from 'uniswap/src/i18n'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { ScantasticParams } from 'wallet/src/features/scantastic/types'
import { selectAccounts, selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'

interface DeepLink {
  url: string
  coldStart: boolean
}

export const ONRAMP_DEEPLINK_DELAY = 1500

export const openDeepLink = createAction<DeepLink>('deeplink/open')

export function* deepLinkWatcher() {
  yield* takeLatest(openDeepLink.type, handleDeepLink)
}

export function* handleDeepLink(action: ReturnType<typeof openDeepLink>) {
  try {
    const { coldStart } = action.payload
    const deepLinkAction = parseDeepLinkUrl(action.payload.url)

    // Handle E2E gate overrides early, before account check, since tests may call this at any point
    if (deepLinkAction.action === DeepLinkAction.E2EOverrideGates) {
      yield* call(handleE2EOverrideGates, deepLinkAction.data)
      return
    }

    const activeAccount = yield* select(selectActiveAccount)

    if (!activeAccount) {
      if (deepLinkAction.action === DeepLinkAction.UniswapWebLink) {
        yield* call(openUri, { uri: deepLinkAction.data.url.toString(), openExternalBrowser: true })
      }
      // If there is no active account, we don't want to handle other deep links
    } else {
      switch (deepLinkAction.action) {
        case DeepLinkAction.UniswapWebLink: {
          yield* call(handleUniswapAppDeepLink, {
            path: deepLinkAction.data.urlPath,
            url: deepLinkAction.data.url.href,
            linkSource: LinkSource.Share,
          })
          break
        }
        case DeepLinkAction.UniswapExternalBrowserLink: {
          yield* call(openUri, { uri: deepLinkAction.data.url.toString(), openExternalBrowser: true })
          break
        }
        case DeepLinkAction.WalletConnectAsParam:
        case DeepLinkAction.UniswapWalletConnect: {
          yield* call(handleWalletConnectDeepLink, deepLinkAction.data.wcUri)
          break
        }
        case DeepLinkAction.UniswapWidget: {
          yield* call(handleUniswapAppDeepLink, {
            path: deepLinkAction.data.url.hash,
            url: deepLinkAction.data.url.toString(),
            linkSource: LinkSource.Widget,
          })
          break
        }
        case DeepLinkAction.Scantastic: {
          yield* call(handleScantasticDeepLink, deepLinkAction.data.scantasticQueryParams)
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
              yield* call(handleSwapLink, deepLinkAction.data.url, parseSwapLinkMobileFormatOrThrow)
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
          if (deepLinkAction.data.userAddress) {
            const validUserAddress = yield* call(parseAndValidateUserAddress, deepLinkAction.data.userAddress)
            yield* put(setAccountAsActive(validUserAddress))
          }
          yield* call(handleGoToFiatOnRampDeepLink, deepLinkAction.data)
          break
        }
        case DeepLinkAction.TokenDetails: {
          yield* put(closeAllModals())
          yield* call(handleGoToTokenDetailsDeepLink, deepLinkAction.data.currencyId)
          break
        }
        case DeepLinkAction.EarnScreen: {
          yield* put(closeAllModals())
          const mainTabsParams = {
            screen: MobileScreens.Home,
            params: {
              earnCardExpansionRequestId: Date.now(),
            },
          } as const
          yield* call(navigate, MobileScreens.MainTabs, mainTabsParams, { pop: true })
          break
        }
        case DeepLinkAction.Unknown:
        case DeepLinkAction.Error: {
          break
        }
      }
    }

    // Send analytics event consistently regardless of whether there's an active account
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
    screen: deepLinkAction.data.screen,
    is_cold_start: coldStart,
    source: deepLinkAction.data.source,
  })
}

function* handleGoToFiatOnRampDeepLink(data: PayloadWithFiatOnRampParams) {
  const disableForKorea = getStatsigClient().checkGate(getFeatureFlagName(FeatureFlags.DisableFiatOnRampKorea))
  if (disableForKorea) {
    navigate(ModalName.KoreaCexTransferInfoModal)
  } else {
    const { moonpayOnly, amount, moonpayCurrencyCode } = data

    // Add delay to fix android onramp issue causing isSheetReady to remain false
    yield* delay(isAndroid ? ONRAMP_DEEPLINK_DELAY : 0)

    yield* put(
      openModal({
        name: ModalName.FiatOnRampAggregator,
        initialState: {
          providers: moonpayOnly ? ['MOONPAY'] : undefined,
          prefilledAmount: amount,
          currencyCode: moonpayCurrencyCode,
        },
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
  const matchingAccount = Object.values(userAccounts).find((account) =>
    areEvmAddressesEqual(account.address, userAddress),
  )

  if (!matchingAccount) {
    throw new Error('User address supplied in path does not exist in wallet')
  }

  return matchingAccount.address
}

function* handleScantasticDeepLink(scantasticQueryParams: string): Generator {
  const params = parseScantasticParams(scantasticQueryParams)
  const scantasticEnabled = getStatsigClient().checkGate(getFeatureFlagName(FeatureFlags.Scantastic))

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
  yield* call(navigate, ModalName.Scantastic, { params })
}

function handleE2EOverrideGates({ enable }: { enable: string[] }): void {
  if (!getConfig().isE2ETest) {
    return
  }

  const overrideAdapter = getOverrideAdapter()
  overrideAdapter.removeAllOverrides()

  for (const gate of enable) {
    overrideAdapter.overrideGate(gate, true)
  }
}
