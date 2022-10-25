import { MMKV } from 'react-native-mmkv'
import {
  Environment,
  Network,
  Observable,
  RequestParameters,
  Store,
  Variables,
} from 'relay-runtime'
import { config } from 'src/config'
import { uniswapUrls } from 'src/constants/urls'
import { RecordSource } from 'src/data/recordSource'
import { NetworkError, NetworkErrorType } from 'src/data/types'
import { logException, logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'

if (__DEV__) {
  // We need to add the plugin before creating `RelayEnvironment`. See discussion here:
  // https://github.com/th3rdwave/flipper-plugin-relay-devtools/issues/10#issuecomment-1135440690
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-flipper-relay-devtools').addPlugin()
}

function parseNetworkError(status: number): NetworkErrorType {
  switch (status) {
    case 401:
      return NetworkErrorType.Unauthorized
    case 403:
      return NetworkErrorType.Forbidden
    case 404:
      return NetworkErrorType.NotFound
    case 429:
      return NetworkErrorType.TooManyRequests
    case 500:
      return NetworkErrorType.InternalServerError
    case 503:
      return NetworkErrorType.ServiceUnavailable
    default:
      return NetworkErrorType.Unknown
  }
}

/**
 * @returns A Relay Environment with custom `fetch`, Observables and disk persistnce.
 */
const createRelayEnvironment = () => {
  const recordSource = RecordSource.restore(new MMKV())

  function fetchRelay(request: RequestParameters, variables: Variables) {
    /**
     * Observables allow us to fulfill many responses for the same query.
     * This is required for polling behavior.
     */
    return Observable.create((sink) => {
      fetch(uniswapUrls.graphQLUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': config.uniswapApiKey,
          // TODO: remove once API gateway supports mobile origin URL
          Origin: config.uniswapAppUrl,
        },
        body: JSON.stringify({
          query: request.text,
          variables,
        }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json()
          }

          throw new NetworkError(parseNetworkError(response.status))
        })
        .then((data) => {
          sink.next(data)
          sink.complete()

          recordSource.dump()
        })
        .catch((error) => {
          logException(LogContext.Relay, error)

          if (error instanceof NetworkError) {
            sink.error(error)
          } else {
            sink.error(new NetworkError(NetworkErrorType.Unknown))
          }
        })
    })
  }

  const newEnvironment = new Environment({
    network: Network.create(fetchRelay),
    store: new Store(recordSource),

    // Reports missing fields events to sentry.
    requiredFieldLogger: (args) => {
      switch (args.kind) {
        case 'missing_field.log':
          logMessage(LogContext.Relay, `GraphQL field missing: ${args.fieldPath}`)
          break
        case 'missing_field.throw':
          const error = new Error(`GraphQL field missing: ${args.fieldPath}`)
          logException(LogContext.Relay, error)
      }
    },
  })

  return newEnvironment
}

export const RelayEnvironment = createRelayEnvironment()
