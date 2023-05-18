import * as SentryRN from '@sentry/react-native'
import { SeverityLevel } from '@sentry/types'

import { ISentry } from './Sentry'

/**
 * Logs an exception to our Sentry Dashboard
 *
 * @param context Context from where this method is called
 * @param error Can be the full error object or a custom error message
 * @param extraArgs Key/value pairs to enrich logging and allow filtering.
 *                  More info here: https://docs.sentry.io/platforms/react-native/enriching-events/context/
 */
export function captureException(context: string, error: unknown, ...extraArgs: unknown[]): void {
  SentryRN.captureException(error, {
    ...(extraArgs ? { extra: { data: extraArgs } } : {}),
    tags: { mobileContext: context },
  })
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

export const Sentry: ISentry = {
  captureException,
  captureMessage,
} as ISentry
