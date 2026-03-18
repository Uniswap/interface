// biome-ignore assist/source/organizeImports: we want to keep the import order
import './wdyr'
// biome-ignore assist/source/organizeImports: we want to keep the import order
import { isNonTestDev } from 'utilities/src/environment/constants'

if (isNonTestDev) {
  require('./ReactotronConfig')
}

import { AppRegistry } from 'react-native'
import 'react-native-gesture-handler'
import 'react-native-reanimated'
import 'src/logbox'
import 'src/polyfills'
// biome-ignore assist/source/organizeImports: we want to keep the import order
import App from 'src/app/App'
import AppConfig from './app.config'

AppRegistry.registerComponent(AppConfig.name, () => App)
