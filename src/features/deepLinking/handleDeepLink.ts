import { createAction } from '@reduxjs/toolkit'
import { URL } from 'react-native-url-polyfill'
import { CallEffect, ForkEffect, PutEffect, SelectEffect } from 'redux-saga/effects'
import { appSelect } from 'src/app/hooks'
import { handleSwapLink } from 'src/features/deepLinking/handleSwapLink'
import { handleTransactionLink } from 'src/features/deepLinking/handleTransactionLink'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { selectAccounts } from 'src/features/wallet/selectors'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { connectToApp, isValidWCUrl } from 'src/features/walletConnect/WalletConnect'
import { setDidOpenFromDeepLink } from 'src/features/walletConnect/walletConnectSlice'
import { logger } from 'src/utils/logger'
import { call, fork, put, takeLatest } from 'typed-redux-saga'

export interface DeepLink {
  url: string
  coldStart: boolean
}

export const openDeepLink = createAction<DeepLink>('deeplink/open')

export function* deepLinkWatcher(): Generator<ForkEffect<never>, void, unknown> {
  yield* takeLatest(openDeepLink.type, handleDeepLink)
}

export function* handleDeepLink(action: ReturnType<typeof openDeepLink>): Generator<
  | CallEffect<boolean>
  | ForkEffect<void>
  | PutEffect<{
      payload: boolean | undefined
      type: string
    }>
  | CallEffect<string>
  | PutEffect<{
      payload: string
      type: string
    }>
  | CallEffect<unknown>,
  void,
  unknown
> {
  const { coldStart } = action.payload
  try {
    // Skip handling any uniswap:// deep links for now for security reasons
    // currently only used for WalletConnect flow fallback
    if (action.payload.url.startsWith('uniswap://')) {
      // Set didOpenFromDeepLink so that `returnToPreviousApp()` is enabled during WalletConnect flows
      yield* put(setDidOpenFromDeepLink(true))
      return
    }

    const url = new URL(action.payload.url)

    // Handle WC deeplink connections
    if (url.pathname.includes('/wc')) {
      // Only initial session connections include `uri` param, signing requests only link to /wc
      const wcUri = url.searchParams.get('uri')
      if (wcUri) {
        const isValidWcUri = yield* call(isValidWCUrl, wcUri)
        if (isValidWcUri) {
          yield* fork(connectToApp, wcUri)
        }
      }
      // Set didOpenFromDeepLink so that `returnToPreviousApp()` is enabled during WalletConnect flows
      yield* put(setDidOpenFromDeepLink(true))
      return
    }

    const screen = url.searchParams.get('screen')
    const userAddress = url.searchParams.get('userAddress')

    const validUserAddress = yield* call(parseAndValidateUserAddress, userAddress)
    yield* put(activateAccount(validUserAddress))

    switch (screen) {
      case 'transaction':
        yield* call(handleTransactionLink)
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

export function* parseAndValidateUserAddress(
  userAddress: string | null
): Generator<SelectEffect, string, unknown> {
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
