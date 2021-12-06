import { LogBox } from 'react-native'

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
