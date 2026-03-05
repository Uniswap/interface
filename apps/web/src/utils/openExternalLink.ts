import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { anonymizeLink } from '~/utils/anonymizeLink'

/**
 * Fires ExternalLinkClicked analytics and opens the URL in a new tab with noopener,noreferrer.
 */
export function openExternalLink(href: string): void {
  sendAnalyticsEvent(InterfaceEventName.ExternalLinkClicked, {
    label: anonymizeLink(href),
  })
  window.open(href, '_blank', 'noopener,noreferrer')
}
