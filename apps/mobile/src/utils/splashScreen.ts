import SplashScreen from 'react-native-splash-screen'

/**
 * Custom wrapped function to hide the splash screen.
 * We need this so that we can hide any errors that may occur (e.g. unhandled promise rejection when FaceID is unlocking)
 */
export function hideSplashScreen(): void {
  SplashScreen.hide()
}
