import 'react-native-gesture-handler/jestSetup'

// jest.mock('react-native-reanimated', () => {
//     const Reanimated = require('react-native-reanimated/mock');
//
//     // The mock for `call` immediately calls the callback which is incorrect
//     // So we override it with a no-op
//     Reanimated.default.call = () => {};
//
//     return Reanimated;
// });

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

/**
 * Prevent error 'expo-linking needs access to the expo-constants manifest' when
 * running unit tests.
 *
 * @see https://github.com/expo/expo/issues/18742
 */
jest.mock('expo-linking', () => {
  var module = {
    ...jest.requireActual('expo-linking'),
    createURL: jest.fn(),
  }

  return module
})
