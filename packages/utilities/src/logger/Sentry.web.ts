import { CaptureContext, SeverityLevel } from '@sentry/types'
import { ISentry } from './Sentry'

/**
 * Logs an exception to our Sentry Dashboard
 *
 * @param error A custom error message
 * @param context Context from where this method is called
 */
export function captureException(error: unknown, captureContext?: CaptureContext): void {
  // eslint-disable-next-line no-console
  console.warn(error, captureContext)
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
  // eslint-disable-next-line no-console
  console.log(context, message, ...extraArgs)
}

export const Sentry: ISentry = {
  captureException,
  captureMessage,
} as ISentry
