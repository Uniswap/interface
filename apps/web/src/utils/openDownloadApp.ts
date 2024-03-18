import { AppDownloadPlatform, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'
import { isAndroid, isIOS } from 'uniswap/src/utils/platform'

// OneLink will direct to App/Play Store or microsite depending on user agent
const APP_DOWNLOAD_LINKS: Partial<{ [key in InterfaceElementName]: string }> = {
  [InterfaceElementName.UNISWAP_WALLET_MODAL_DOWNLOAD_BUTTON]: 'https://uniswapwallet.onelink.me/8q3y/qfwlncf9',
  [InterfaceElementName.UNISWAP_WALLET_NAVBAR_MENU_DOWNLOAD_BUTTON]: 'https://uniswapwallet.onelink.me/8q3y/46tvu6pb',
  [InterfaceElementName.UNISWAP_WALLET_LANDING_PAGE_DOWNLOAD_BUTTON]: 'https://uniswapwallet.onelink.me/8q3y/79gveilz',
  [InterfaceElementName.UNISWAP_WALLET_BANNER_DOWNLOAD_BUTTON]: 'https://uniswapwallet.onelink.me/8q3y/jh9orof3',
}

export const MICROSITE_LINK = 'https://wallet.uniswap.org/'

type OpenDownloadAppOptions = {
  element: InterfaceElementName
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
  if (isIOS) {
    openDownloadStore({ element, appPlatform: AppDownloadPlatform.IOS, linkTarget: 'uniswap_wallet_appstore' })
  } else if (isAndroid) {
    openDownloadStore({ element, appPlatform: AppDownloadPlatform.ANDROID, linkTarget: 'uniswap_wallet_playstore' })
  } else {
    sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_MICROSITE_OPENED, { element })
    window.open(APP_DOWNLOAD_LINKS[element], /* target = */ 'uniswap_wallet_microsite')
  }
}

type AnalyticsLinkOptions = {
  element: InterfaceElementName
  appPlatform?: AppDownloadPlatform
  linkTarget?: string
}

const openDownloadStore = (options: AnalyticsLinkOptions) => {
  sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_APP_DOWNLOAD_OPENED, {
    element: options.element,
    appPlatform: options?.appPlatform,
  })
  window.open(APP_DOWNLOAD_LINKS[options.element], /* target = */ options.linkTarget)
}
