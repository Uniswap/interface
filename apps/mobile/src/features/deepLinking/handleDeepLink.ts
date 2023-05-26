import { createAction } from '@reduxjs/toolkit'
import { parseUri } from '@walletconnect/utils'
import { Alert } from 'react-native'
import { URL } from 'react-native-url-polyfill'
import { ForkEffect } from 'redux-saga/effects'
import { appSelect } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { handleMoonpayReturnLink } from 'src/features/deepLinking/handleMoonpayReturnLink'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLink'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLink'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { selectAccounts, selectActiveAccount } from 'src/features/wallet/selectors'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { connectToApp, isValidWCUrl } from 'src/features/walletConnect/WalletConnect'
import { setDidOpenFromDeepLink } from 'src/features/walletConnect/walletConnectSlice'
import { pairWithWalletConnectURI } from 'src/features/walletConnectV2/utils'
import { call, fork, put, takeLatest } from 'typed-redux-saga'
import { logger } from 'wallet/src/features/logger/logger'

export interface DeepLink {
  url: string
  coldStart: boolean
}

const UNISWAP_URL_SCHEME = 'uniswap://'
const UNISWAP_URL_SCHEME_WALLETCONNECT = 'uniswap://wc?uri='

export const openDeepLink = createAction<DeepLink>('deeplink/open')

export function* deepLinkWatcher(): Generator<ForkEffect<never>, void, unknown> {
  yield* takeLatest(openDeepLink.type, handleDeepLink)
}

export function* handleDeepLink(action: ReturnType<typeof openDeepLink>) {
  const { coldStart } = action.payload
  try {
    // Skip handling any deep links if user doesn't have an active account
    const activeAccount = yield* appSelect(selectActiveAccount)
    if (!activeAccount) {
      return
    }

    const url = new URL(action.payload.url)

    // Handle WC deep link via URL scheme connections (ex. uniswap://wc?uri=123))
    if (action.payload.url.startsWith(UNISWAP_URL_SCHEME_WALLETCONNECT)) {
      let wcUri = action.payload.url.split(UNISWAP_URL_SCHEME_WALLETCONNECT)[1]
      if (!wcUri) return
      // Decode URI to handle special characters like %3A => :
      wcUri = decodeURIComponent(wcUri)
      yield* call(handleWalletConnectDeepLink, wcUri)
      return
    }

    // Skip handling any non-WalletConnect uniswap:// URL scheme deep links for now for security reasons
    // Currently only used on WalletConnect Universal Link web page fallback button (https://uniswap.org/app/wc)
    if (action.payload.url.startsWith(UNISWAP_URL_SCHEME)) {
      // Set didOpenFromDeepLink so that `returnToPreviousApp()` is enabled during WalletConnect flows
      yield* put(setDidOpenFromDeepLink(true))
      return
    }

    // Handle WC universal links connections (ex. https://uniswap.org/app/wc?uri=123)
    if (url.pathname.includes('/wc')) {
      // Only initial session connections include `uri` param, signing requests only link to /wc
      const wcUri = url.searchParams.get('uri')
      if (!wcUri) return
      yield* call(handleWalletConnectDeepLink, wcUri)
      return
    }

    const screen = url.searchParams.get('screen')
    const userAddress = url.searchParams.get('userAddress')
    const fiatOnRamp = url.searchParams.get('fiatOnRamp') === 'true'

    const validUserAddress = yield* call(parseAndValidateUserAddress, userAddress)
    yield* put(activateAccount(validUserAddress))

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

    yield* call(sendAnalyticsEvent, MobileEventName.DeepLinkOpened, {
      url: url.toString(),
      screen,
      is_cold_start: coldStart,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const errorMessage = error?.message
    yield* call(
      logger.error,
      'handleDeepLink',
      'handleDeepLink',
      `Error handling deep link ${action.payload.url}: ${errorMessage}`
    )
  }
}

export function* handleWalletConnectDeepLink(wcUri: string) {
  const isValidWcUri = yield* call(isValidWCUrl, wcUri)
  if (isValidWcUri) {
    yield* fork(connectToApp, wcUri)
  }

  if (parseUri(wcUri).version === 2) {
    try {
      pairWithWalletConnectURI(wcUri)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (errorMessage: any) {
      Alert.alert(
        i18n.t('WalletConnect Error'),
        i18n.t(`There was an issue with WalletConnect. \n\n Error information:\n {{error}}`, {
          error: errorMessage,
        })
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
