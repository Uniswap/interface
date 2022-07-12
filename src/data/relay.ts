import {
  Environment,
  Network,
  RecordSource,
  RequestParameters,
  Store,
  Variables,
} from 'relay-runtime'
import { config } from 'src/config'

async function fetchRelay(params: RequestParameters, variables: Variables) {
  const response = await fetch(config.uniswapApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.uniswapApiKey,
    },
    body: JSON.stringify({
      query: params.text,
      variables,
    }),
  })
  return await response.json()
}

export default new Environment({
  network: Network.create(fetchRelay),
  store: new Store(new RecordSource()),
})
