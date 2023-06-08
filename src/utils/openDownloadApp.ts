import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceElementName, InterfaceEventName, SharedEventName } from '@uniswap/analytics-events'
import { isIOS } from 'utils/userAgent'

const APP_STORE_LINK = 'https://apps.apple.com/app/apple-store/id6443944476'
const MICROSITE_LINK = 'https://wallet.uniswap.org/'

type OpenDownloadAppOptions = {
  appStoreParams?: string
  microSiteParams?: string
  analyticsEventName?: SharedEventName
}

const defaultDownloadAppOptions = {
  appStoreParams: `?pt=123625782&ct=In-App-Banners&mt=8`,
  analyticsEventName: SharedEventName.ELEMENT_CLICKED,
}

export function openDownloadApp(
  element?: InterfaceElementName,
  options: OpenDownloadAppOptions = defaultDownloadAppOptions
) {
  sendAnalyticsEvent(options.analyticsEventName ?? SharedEventName.ELEMENT_CLICKED, { element })
  const link = getDownloadAppLink(options)
  if (isIOS) {
    openAppStore(link)
  } else {
    openWalletMicrosite(link)
  }
}

const openAppStore = (link: string) => {
  window.open(link, /* target = */ 'uniswap_wallet_appstore')
}

export const openWalletMicrosite = (link: string) => {
  sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_MICROSITE_OPENED)
  window.open(link, /* target = */ 'uniswap_wallet_microsite')
}

export const getDownloadAppLink = (options: OpenDownloadAppOptions = defaultDownloadAppOptions) =>
  isIOS ? APP_STORE_LINK + (options.appStoreParams || '') : MICROSITE_LINK + (options.microSiteParams || '')
