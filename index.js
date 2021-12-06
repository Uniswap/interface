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
  // https://github.com/software-mansion/react-native-gesture-handler/issues/1036
  'Warning: findNodeHandle',
  // https://github.com/d3/d3-interpolate/issues/99
  'Require cycle',
])

AppRegistry.registerComponent(appName, () => App)
