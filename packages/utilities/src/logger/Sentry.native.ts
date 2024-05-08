import * as SentryRN from '@sentry/react-native'
import { CaptureContext, SeverityLevel } from '@sentry/types'
import { BreadCrumb, ISentry } from './Sentry'

/**
 * Logs an exception to our Sentry Dashboard
 *
 * @param error A custom error
 * @param context Context from where this method is called
 */
export function captureException(error: unknown, captureContext?: CaptureContext): void {
  SentryRN.captureException(error, captureContext)
}

/**
 * Sends a message to our Sentry Dashboard
 *
 * @param level Sentry severity level
 * @param context Context from where this method is called
 * @param message Message
 * @param extraArgs Key/value pairs to enrich logging and allow filtering.
 *                  More info here: https://docs.sentry.io/platforms/react-native/enriching-events/context/
 */
export function captureMessage(
  level: SeverityLevel,
  context: string,
  message: string,
  ...extraArgs: unknown[]
): void {
  SentryRN.captureMessage(message, {
    level,
    tags: { mobileContext: context },
    ...(extraArgs ? { extra: { data: extraArgs } } : {}),
  })
}

function addBreadCrumb(breadCrumb: BreadCrumb): void {
  SentryRN.addBreadcrumb(breadCrumb)
}

export const Sentry: ISentry = {
  captureException,
  captureMessage,
  addBreadCrumb,
} as ISentry
