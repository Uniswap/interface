import * as WebBrowser from 'expo-web-browser'
import { colorsLight } from 'ui/src/theme'
import { canOpenURL, openURL } from 'uniswap/src/utils/link'
import { logger } from 'utilities/src/logger/logger'

const ALLOWED_EXTERNAL_URI_SCHEMES = ['http://', 'https://']

/**
 * Opens allowed URIs. if isSafeUri is set to true then this will open http:// and https:// as well as some deeplinks.
 * Only set this flag to true if you have formed the URL yourself in our own app code. For any URLs from an external source
 * isSafeUri must be false and it will only open http:// and https:// URI schemes.
 *
 * @param openExternalBrowser whether to leave the app and open in system browser. default is false, opens in-app browser window
 * @param isSafeUri whether to bypass ALLOWED_EXTERNAL_URI_SCHEMES check
 * @param controlsColor When opening in an in-app browser, determines the controls color
 **/
export async function openUri(
  uri: string,
  openExternalBrowser = false,
  isSafeUri = false,
  // NOTE: okay to use colors object directly as we want the same color for light/dark modes
  controlsColor = colorsLight.accent1,
): Promise<void> {
  const trimmedURI = uri.trim()
  if (!isSafeUri && !ALLOWED_EXTERNAL_URI_SCHEMES.some((scheme) => trimmedURI.startsWith(scheme))) {
    // TODO: [MOB-253] show a visual warning that the link cannot be opened.
    logger.error(new Error('User attempted to open potentially unsafe url'), {
      tags: {
        file: 'linking',
        function: 'openUri',
      },
      extra: { uri },
    })
    return
  }

  const isHttp = /^https?:\/\//.test(trimmedURI)

  // `canOpenURL` returns `false` for App Links / Universal Links, so we just assume any device can handle the `https://` protocol.
  const supported = isHttp ? true : await canOpenURL(uri)

  if (!supported) {
    logger.warn('linking', 'openUri', `Cannot open URI: ${uri}`)
    return
  }

  try {
    if (openExternalBrowser) {
      await openURL(uri)
    } else {
      await WebBrowser.openBrowserAsync(uri, {
        controlsColor,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        windowFeatures: 'popup=false',
      })
    }
  } catch (error) {
    logger.error(error, { tags: { file: 'linking', function: 'openUri' } })
  }
}
