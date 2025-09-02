import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { AppDownloadPlatform } from 'uniswap/src/features/telemetry/types'
import { isWebAndroid, isWebIOS } from 'utilities/src/platform'

// OneLink will direct to App/Play Store or microsite depending on user agent
const APP_DOWNLOAD_LINKS: Partial<{ [key in ElementName]: string }> = {
  [ElementName.UniswapWalletModalDownloadButton]: 'https://uniswapwallet.onelink.me/8q3y/qfwlncf9',
  [ElementName.UniswapWalletNavbarMenuDownloadButton]: 'https://uniswapwallet.onelink.me/8q3y/46tvu6pb',
  [ElementName.UniswapWalletLandingPageDownloadButton]: 'https://uniswapwallet.onelink.me/8q3y/79gveilz',
  [ElementName.UniswapWalletBannerDownloadButton]: 'https://uniswapwallet.onelink.me/8q3y/jh9orof3',
}

export const MICROSITE_LINK = 'https://wallet.uniswap.org/'

type OpenDownloadAppOptions = {
  element: ElementName
}

/**
 * Note: openDownloadApp is equivalent to APP_DOWNLOAD_LINKS[element], the first just runs imperatively
 * and adds an analytics event, where the other only returns a link. Typically you'll use both:
 *
 * <a href={APP_DOWNLOAD_LINKS[element]} onClick={() => openDownloadApp(element)} />
 *
 * This way with JS disabled and when hovering the <a /> you see and nav to the full href properly,
 * but with JS on it will send the analytics event before navigating to the href.
 *
 * I've added a helper `getDownloadAppLinkProps` that unifies this behavior into one thing.
 */
export function openDownloadApp({ element }: OpenDownloadAppOptions) {
  if (isWebIOS) {
    openDownloadStore({ element, appPlatform: AppDownloadPlatform.Ios, linkTarget: 'uniswap_wallet_appstore' })
  } else if (isWebAndroid) {
    openDownloadStore({ element, appPlatform: AppDownloadPlatform.Android, linkTarget: 'uniswap_wallet_playstore' })
  } else {
    sendAnalyticsEvent(InterfaceEventName.UniswapWalletMicrositeOpened, { element })
    window.open(APP_DOWNLOAD_LINKS[element], /* target = */ 'uniswap_wallet_microsite')
  }
}

type AnalyticsLinkOptions = {
  element: ElementName
  appPlatform?: AppDownloadPlatform
  linkTarget?: string
}

const openDownloadStore = (options: AnalyticsLinkOptions) => {
  sendAnalyticsEvent(InterfaceEventName.UniswapWalletAppDownloadOpened, {
    element: options.element,
    appPlatform: options.appPlatform,
  })
  window.open(APP_DOWNLOAD_LINKS[options.element], /* target = */ options.linkTarget)
}
