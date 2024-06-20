import { InterfaceEventName } from '@ubeswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'

export function outboundLink({ label }: { label: string }) {
  sendAnalyticsEvent(InterfaceEventName.EXTERNAL_LINK_CLICK, {
    label,
  })
}
