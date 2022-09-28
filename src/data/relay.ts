import { Environment, RecordSource, Store } from 'react-relay-offline'
import { Network } from 'relay-runtime'
import { fetchWithObservables } from 'src/data/fetch'

export const RelayEnvironment = new Environment({
  network: Network.create(fetchWithObservables),
  store: new Store(new RecordSource()),
})

if (__DEV__) {
  // We need to add the plugin in this file. See discussion here:
  // https://github.com/th3rdwave/flipper-plugin-relay-devtools/issues/10#issuecomment-1135440690
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-flipper-relay-devtools').addPlugin()
}
