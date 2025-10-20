import { call } from 'typed-redux-saga'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

/**
 * Opens a URL in a browser window (in-app or external).
 *
 * @param url - The URL to open
 * @param openInApp - If true, opens in in-app browser; if false, opens in external browser
 */
export function* handleInAppBrowser(url: string, openInApp: boolean = true) {
  try {
    const browserType = openInApp ? 'in-app browser' : 'external browser'
    yield* call(logger.info, 'handleInAppBrowserSaga', 'handleInAppBrowser', `Opening URL in ${browserType}: ${url}`)

    // Open the URL using openUri with the specified browser preference
    yield* call(openUri, {
      uri: url,
      openExternalBrowser: !openInApp, // Use external browser if openInApp is false
      isSafeUri: true, // URL has been allowlisted so it's safe
    })

    yield* call(
      logger.info,
      'handleInAppBrowserSaga',
      'handleInAppBrowser',
      `Successfully opened URL in ${browserType}: ${url}`,
    )
  } catch (error) {
    yield* call(logger.error, error, {
      tags: { file: 'handleInAppBrowserSaga', function: 'handleInAppBrowser' },
      extra: { url },
    })
  }
}
