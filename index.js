import { AppRegistry } from 'react-native'
import 'react-native-gesture-handler'
import 'react-native-reanimated'
import { App } from 'src/app/App'
import 'src/app/i18n'
import 'src/polyfills'
import { name as appName } from './app.json'
import 'src/logbox'

AppRegistry.registerComponent(appName, () => App)
