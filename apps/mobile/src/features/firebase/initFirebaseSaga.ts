import firebase from '@react-native-firebase/app'
import '@react-native-firebase/auth'
import { call } from 'typed-redux-saga'
import { logger } from 'wallet/src/features/logger/logger'

export function* initFirebase() {
  yield* call(anonFirebaseSignIn)
  logger.debug('initFirebaseSaga', 'initFirebase', 'Firebase initialization successful')
}

function* anonFirebaseSignIn() {
  try {
    const firebaseAuth = firebase.app().auth()
    yield* call([firebaseAuth, 'signInAnonymously'])
  } catch (error) {
    logger.error('Error signing into Firebase anonymously', {
      tags: {
        file: 'initFirebaseSaga',
        function: 'anonFirebaseSignIn',
        error: JSON.stringify(error),
      },
    })
  }
}
