import { ApolloError } from '@apollo/client'
import { ErrorEvent, EventHint } from '@sentry/types'

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
  }

  return event
}
