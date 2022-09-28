import { Observable, RequestParameters, Variables } from 'relay-runtime'
import { Sink } from 'relay-runtime/lib/network/RelayObservable'
import { config } from 'src/config'

async function fetchRelay(request: RequestParameters, variables: Variables, sink: Sink<any>) {
  const response = await fetch(config.uniswapApiUrl, {
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

  const data = await response.json()

  sink.next(data)
  sink.complete()
}

/**
 * Observables allow us to fulfill many responses for the same query.
 * This is required for polling behavior.
 */
export const fetchWithObservables = (request: RequestParameters, variables: Variables) => {
  return Observable.create((sink) => {
    fetchRelay(request, variables, sink)
  })
}
