import firebase from 'firebase/compat/app'
import { getMessaging, getToken } from 'firebase/messaging'

import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_VAPID_KEY,
} from 'constants/env'

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
}

const vapidKey = FIREBASE_VAPID_KEY

export const fetchToken = () => {
  const firebaseApp = firebase.initializeApp(firebaseConfig)
  const messaging = getMessaging(firebaseApp)
  return getToken(messaging, {
    vapidKey,
  })
    .then(currentToken => {
      if (currentToken) {
        return currentToken
        // Track the token -> client mapping, by sending to backend server
        // show on the UI that permission is secured
      } else {
        return ''
        // shows on the UI that permission is required
      }
    })
    .catch(err => {
      console.log(err)
      // catch error while creating client token
      return ''
    })
}
