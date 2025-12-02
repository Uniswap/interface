import React from 'react'
import { logger } from 'utilities/src/logger/logger'
import { isWebApp } from 'utilities/src/platform'
// biome-ignore lint/style/noRestrictedImports: Platform-specific implementation needs internal types
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

/**
 * Given a set of child element and action props, returns a spreadable
 * object of the event handlers augmented with telemetry logging.
 */
export function getEventHandlers({
  child,
  consumedProps,
  triggers,
  eventName,
  element,
  properties,
}: {
  child: React.ReactElement
  consumedProps: ITraceContext
  triggers: string[]
  eventName: string
  element?: string
  properties?: Record<string, unknown>
}): Partial<Record<string, (e: Event) => void>> {
  const eventHandlers: Partial<Record<string, (e: Event) => void>> = {}
  for (const event of triggers) {
    eventHandlers[event] = (eventHandlerArgs: unknown): void => {
      // Some interface elements don't have handlers defined.
      // TODO(WEB-4252): Potentially can remove isWebApp check once web is fully converted to tamagui
      if (!child.props[event] && !isWebApp) {
        logger.info('trace/utils.ts', 'getEventHandlers', 'Found a null handler while logging an event', {
          eventName,
          ...consumedProps,
          ...properties,
        })
      }

      // call child event handler with original arguments
      child.props[event]?.apply(child, [eventHandlerArgs])

      // augment handler with analytics logging
      analytics.sendEvent(eventName, {
        element,
        ...consumedProps,
        ...properties,
      })
    }
  }

  // return a spreadable event handler object
  return eventHandlers
}
