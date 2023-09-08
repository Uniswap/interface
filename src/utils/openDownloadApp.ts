import { InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'
import { isIOS } from 'utils/userAgent'

const APP_STORE_LINK = 'https://apps.apple.com/app/apple-store/id6443944476'
const MICROSITE_LINK = 'https://wallet.uniswap.org/'

type OpenDownloadAppOptions = {
  element?: InterfaceElementName
  appStoreParams?: string
  microSiteParams?: string
}

const defaultDownloadAppOptions = {
  appStoreParams: `pt=123625782&ct=In-App-Banners&mt=8`,
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
    openAppStore({ element: options?.element, urlParamString: options?.appStoreParams })
  } else {
    openWalletMicrosite({ element: options?.element, urlParamString: options?.microSiteParams })
  }
}

// if you need this by itself can add export, not used externally for now
export const getDownloadAppLink = (options: OpenDownloadAppOptions = defaultDownloadAppOptions) =>
  isIOS
    ? linkWithParams(APP_STORE_LINK, options?.appStoreParams)
    : linkWithParams(MICROSITE_LINK, options?.microSiteParams)

export const getDownloadAppLinkProps = (options: OpenDownloadAppOptions = defaultDownloadAppOptions) => {
  return {
    href: getDownloadAppLink(options),
    onClick(e: { preventDefault: () => void }) {
      e.preventDefault()
      openDownloadApp(options)
    },
  }
}

type AnalyticsLinkOptions = {
  element?: InterfaceElementName
  urlParamString?: string
}

const openAppStore = (options?: AnalyticsLinkOptions) => {
  sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_APP_DOWNLOAD_OPENED, { element: options?.element })
  window.open(linkWithParams(APP_STORE_LINK, options?.urlParamString), /* target = */ 'uniswap_wallet_appstore')
}

export const openWalletMicrosite = (options?: AnalyticsLinkOptions) => {
  sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_MICROSITE_OPENED, { element: options?.element })
  window.open(linkWithParams(MICROSITE_LINK, options?.urlParamString), /* target = */ 'uniswap_wallet_microsite')
}

const linkWithParams = (link: string, params?: string) => link + (params ? `?${params}` : '')
