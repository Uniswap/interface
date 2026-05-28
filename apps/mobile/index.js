// Eagerly register Statsig before any saga can call .instance(). Must be first.
import './src/app/statsigBootstrap'
import './wdyr'
import { isNonTestDev } from '@universe/environment'

if (isNonTestDev) {
  require('./ReactotronConfig')
}

import 'react-native-gesture-handler'
import 'react-native-reanimated'
import 'src/logbox'
import 'src/polyfills'
import { AppRegistry } from 'react-native'
import App from 'src/app/App'
import AppConfig from './app.config'

AppRegistry.registerComponent(AppConfig.name, () => App)
