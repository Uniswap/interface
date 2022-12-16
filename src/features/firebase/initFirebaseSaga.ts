import firebase from '@react-native-firebase/app'
import '@react-native-firebase/auth'
import { logger } from 'src/utils/logger'
import { call } from 'typed-redux-saga'

export function* initFirebase() {
  yield* call(anonFirebaseSignIn)
  logger.debug('initFirebaseSaga', 'initFirebase', 'Firebase initialization successful')
}

function* anonFirebaseSignIn() {
  try {
    const firebaseAuth = firebase.app().auth()
    yield* call([firebaseAuth, 'signInAnonymously'])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error(
      'initFirebaseSaga',
      'anonFirebaseSignIn',
      `Error signing into Firebase anonymously: ${error?.message}`
    )
    throw new Error('Was not able to initialize Firebase user')
  }
}
