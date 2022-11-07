// Disable sorting imports with Prettier for this file so that it doesn't change the order
// organize-imports-ignore
import './wdyr'

import Shake from '@shakebugs/react-native-shake'
import { AppRegistry } from 'react-native'
import 'react-native-gesture-handler'
import 'react-native-reanimated'
import App from 'src/app/App'
import 'src/app/i18n'
import { config } from 'src/config'
import 'src/logbox'
import 'src/polyfills'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => App)

Shake.start(config.shakeClientId, config.shakeClientSecret)
