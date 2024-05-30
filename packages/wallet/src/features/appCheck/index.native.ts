import appCheck from '@react-native-firebase/app-check'
import { config } from 'uniswap/src/config'
import { logger } from 'utilities/src/logger/logger'

export function initFirebaseAppCheck(): void {
  // Configure app check for device attestation
  const firebaseAppCheck = appCheck()
  const rnfbProvider = firebaseAppCheck.newReactNativeFirebaseAppCheckProvider()

  rnfbProvider.configure({
    android: {
      provider: __DEV__ ? 'debug' : 'playIntegrity',
      debugToken: config.firebaseAppCheckDebugToken,
    },
    apple: {
      provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
      debugToken: config.firebaseAppCheckDebugToken,
    },
  })

  firebaseAppCheck
    .initializeAppCheck({
      provider: rnfbProvider,
      isTokenAutoRefreshEnabled: true,
    })
    .catch((error) => {
      logger.error(error, {
        tags: { file: 'firebaseDataSaga', function: 'initFirebaseAppCheck' },
      })
    })
}

export async function getFirebaseAppCheckToken(): Promise<string | null> {
  try {
    const { token } = await appCheck().getToken(true)
    return token
  } catch (error) {
    logger.error(error, { tags: { file: 'firebase/utils', function: 'getFirebaseAppCheckToken' } })
    return null
  }
}
