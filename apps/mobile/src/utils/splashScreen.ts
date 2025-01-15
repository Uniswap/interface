import BootSplash from 'react-native-bootsplash'

/**
 * Custom wrapped function to hide the splash screen.
 * We need this so that we can hide any errors that may occur (e.g. unhandled promise rejection when FaceID is unlocking)
 */
export async function hideSplashScreen(): Promise<void> {
  await BootSplash.hide({ fade: true })
}
