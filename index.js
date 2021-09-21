import { AppRegistry } from 'react-native'
import 'src/polyfills'
import App from 'src/app/App'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => App)
