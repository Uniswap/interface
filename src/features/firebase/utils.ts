import { ReactNativeFirebase } from '@react-native-firebase/app'
import '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import OneSignal from 'react-native-onesignal'

const ADDRESS_DATA_COLLECTION = 'address_data'

export const getFirebaseUidOrError = (firebaseApp: ReactNativeFirebase.FirebaseApp) => {
  const uid = firebaseApp.auth().currentUser?.uid
  if (!uid) throw new Error('User must be signed in to Firebase before accessing Firestore')
  return uid
}

export const getOneSignalUserIdOrError = async () => {
  const onesignalUserId = (await OneSignal.getDeviceState())?.userId
  if (!onesignalUserId) throw new Error('Onesignal user ID is not defined')
  return onesignalUserId
}

export const getFirestoreUidRef = (
  firebaseApp: ReactNativeFirebase.FirebaseApp,
  address: Address
) =>
  firestore(firebaseApp)
    .collection(ADDRESS_DATA_COLLECTION)
    .doc('address_uid_mapping')
    .collection(address.toLowerCase())
    .doc('firebase')

export const getFirestorePushTokenRef = (
  firebaseApp: ReactNativeFirebase.FirebaseApp,
  address: Address
) =>
  firestore(firebaseApp)
    .collection(ADDRESS_DATA_COLLECTION)
    .doc('address_push_token_mapping')
    .collection(address.toLowerCase())
    .doc('onesignal')

export const getFirestoreMetadataRef = (
  firebaseApp: ReactNativeFirebase.FirebaseApp,
  address: Address,
  uid: string
) =>
  firestore(firebaseApp)
    .collection(ADDRESS_DATA_COLLECTION)
    .doc('metadata')
    .collection(address.toLowerCase())
    .doc('firebase_uids')
    .collection(uid)
    .doc('data')
