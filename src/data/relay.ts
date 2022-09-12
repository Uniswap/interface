import { Environment, RecordSource, Store } from 'react-relay-offline'
import { Network, RequestParameters, Variables } from 'relay-runtime'
import { config } from 'src/config'

async function fetchRelay(params: RequestParameters, variables: Variables) {
  const response = await fetch(config.uniswapApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': config.uniswapApiKey,
      // TODO: remove once API gateway supports mobile origin URL
      Origin: config.uniswapAppUrl,
    },
    body: JSON.stringify({
      query: params.text,
      variables,
    }),
  })
  return await response.json()
}

if (__DEV__) {
  // We need to add the plugin in this file. See discussion here:
  // https://github.com/th3rdwave/flipper-plugin-relay-devtools/issues/10#issuecomment-1135440690
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-flipper-relay-devtools').addPlugin()
}

export const RelayEnvironment = new Environment({
  network: Network.create(fetchRelay),
  store: new Store(new RecordSource()),
})
