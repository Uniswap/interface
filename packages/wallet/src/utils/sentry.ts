import { ApolloError } from '@apollo/client'
import { ErrorEvent, EventHint } from '@sentry/types'
import { MissingI18nInterpolationError } from 'uniswap/src/i18n/i18n'

const APOLLO_HTTP_ERROR_REGEX = /Received status code ([0-9]+)/

export function beforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent {
  const exception = hint.originalException

  if (exception instanceof ApolloError) {
    const statusCode = exception.message.match(APOLLO_HTTP_ERROR_REGEX)?.[1]

    if (statusCode) {
      // Do not group together ApolloErrors with different status codes.
      event.fingerprint = ['{{ default }}', String(statusCode)]
      // This changes the title of the error to avoid having multiple issues titled "ApolloError".
      event.exception?.values?.forEach((value) => {
        if (value.type === 'ApolloError') {
          value.type = `ApolloError ${statusCode}`
        }
      })
    }
  } else if (exception instanceof MissingI18nInterpolationError) {
    // We want to split up each i18n interpolation error into its own issue.
    event.fingerprint = ['{{ default }}', String(exception.message)]
  }

  return event
}
