import { AppRegistry, LogBox } from 'react-native'
import 'src/polyfills'
import { App } from 'src/app/App'
import { name as appName } from './app.json'
import 'src/app/i18n'
import 'react-native-reanimated'
import 'react-native-gesture-handler'

// Ignore errors coming from AnimatedComponent, either from React Native itself or possibly an animation lib
// https://github.com/facebook/react-native/issues/22186
LogBox.ignoreLogs([
  'Warning: Using UNSAFE_componentWillMount',
  'Warning: Using UNSAFE_componentWillReceiveProps',
])

AppRegistry.registerComponent(appName, () => App)
