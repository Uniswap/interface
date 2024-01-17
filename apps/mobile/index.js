// Disable sorting imports with Prettier for this file so that it doesn't change the order
// organize-imports-ignore
import './wdyr'

import { AppRegistry } from 'react-native'
import 'react-native-gesture-handler'
import 'react-native-reanimated'
import 'src/logbox'
import 'src/polyfills'
import App from 'src/app/App'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => App)
