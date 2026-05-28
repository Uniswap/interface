import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isAllowedExternalUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { anonymizeLink } from '~/utils/anonymizeLink'

/**
 * Fires ExternalLinkClicked analytics and opens the URL in a new tab with noopener,noreferrer.
 */
export function openExternalLink(href: string): void {
  if (!isAllowedExternalUri(href)) {
    logger.error(new Error('Blocked unsafe external URL'), {
      tags: { file: 'openExternalLink', function: 'openExternalLink' },
      extra: { href },
    })
    return
  }
  sendAnalyticsEvent(InterfaceEventName.ExternalLinkClicked, {
    label: anonymizeLink(href),
  })
  window.open(href, '_blank', 'noopener,noreferrer')
}
