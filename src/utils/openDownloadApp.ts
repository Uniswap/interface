import { AppDownloadPlatform, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'
import { isAndroid, isIOS } from 'utils/userAgent'

// OneLink will direct to App/Play Store or microsite depending on platform
const APP_DOWNLOAD_LINK = 'https://uniswapwallet.onelink.me/8q3y/79gveilz'

type OpenDownloadAppOptions = {
  element?: InterfaceElementName
}

/**
 * Note: openDownloadApp and getDownloadAppLink are equivalent functions, the first just runs imperatively
 * and adds an analytics event, where the other only returns a link. Typically you'll use both:
 *
 * <a href={getDownloadAppLink(options)} onClick={() => openDownloadApp(options)} />
 *
 * This way with JS disabled and when hovering the <a /> you see and nav to the full href properly,
 * but with JS on it will send the analytics event before navigating to the href.
 *
 * I've added a helper `getDownloadAppLinkProps` that unifies this behavior into one thing.
 */

export function openDownloadApp(options: OpenDownloadAppOptions = defaultDownloadAppOptions) {
  if (isIOS) {
    openAppStore({
      element: options?.element,
      appPlatform: AppDownloadPlatform.IOS,
    })
  } else if (isAndroid) {
    openPlayStore({
      element: options?.element,
      appPlatform: AppDownloadPlatform.ANDROID,
    })
  } else {
    openWalletMicrosite({ element: options?.element })
  }
}

export const getDownloadAppLinkProps = (options: OpenDownloadAppOptions = defaultDownloadAppOptions) => {
  return {
    href: APP_DOWNLOAD_LINK,
    onClick(e: { preventDefault: () => void }) {
      e.preventDefault()
      openDownloadApp(options)
    },
  }
}

type AnalyticsLinkOptions = {
  element?: InterfaceElementName
  appPlatform?: AppDownloadPlatform
}

const openAppStore = (options?: AnalyticsLinkOptions) => {
  sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_APP_DOWNLOAD_OPENED, {
    element: options?.element,
    appPlatform: options?.appPlatform,
  })
  window.open(APP_DOWNLOAD_LINK, /* target = */ 'uniswap_wallet_appstore')
}

const openPlayStore = (options?: AnalyticsLinkOptions) => {
  sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_APP_DOWNLOAD_OPENED, {
    element: options?.element,
    appPlatform: options?.appPlatform,
  })
  window.open(APP_DOWNLOAD_LINK, /* target = */ 'uniswap_wallet_playstore')
}

export const openWalletMicrosite = (options?: AnalyticsLinkOptions) => {
  sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_MICROSITE_OPENED, { element: options?.element })
  window.open(APP_DOWNLOAD_LINK, /* target = */ 'uniswap_wallet_microsite')
}

const linkWithParams = (link: string, params?: string) => link + (params ? `?${params}` : '')
