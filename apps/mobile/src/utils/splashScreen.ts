import * as SplashScreen from 'expo-splash-screen'

/**
 * Custom wrapped function to hide the splash screen.
 * We need this so that we can hide any errors that may occur (e.g. unhandled promise rejection when FaceID is unlocking)
 */
export async function hideSplashScreen(): Promise<void> {
  await SplashScreen.hideAsync()
}
