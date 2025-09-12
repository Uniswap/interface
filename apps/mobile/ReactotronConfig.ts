import AsyncStorage from '@react-native-async-storage/async-storage'
import { MMKV } from 'react-native-mmkv'
import type { ReactotronReactNative } from 'reactotron-react-native'
import Reactotron, { openInEditor } from 'reactotron-react-native'
import mmkvPlugin from 'reactotron-react-native-mmkv'
import { reactotronRedux } from 'reactotron-redux'

const storage = new MMKV()

const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: 'Uniswap Wallet',
    onConnect: () => {
      Reactotron.clear()
    },
  })
  .use(mmkvPlugin<ReactotronReactNative>({ storage, ignore: ['react-query-cache', 'apollo-cache-persist'] }))
  .use(reactotronRedux())
  .use(openInEditor())
  .useReactNative()
  .connect()

export default reactotron
