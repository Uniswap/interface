import { InterfaceElementName, InterfaceEventName } from '@ubeswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'

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
  sendAnalyticsEvent(InterfaceEventName.UNISWAP_WALLET_MICROSITE_OPENED, { element })
}
