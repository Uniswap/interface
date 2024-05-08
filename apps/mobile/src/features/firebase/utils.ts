import type { ReactNativeFirebase } from '@react-native-firebase/app'
import '@react-native-firebase/auth'
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import { isBetaBuild, isDevBuild } from 'src/utils/version'

const ADDRESS_DATA_COLLECTION = 'address_data'
const DEV_ADDRESS_DATA_COLLECTION = 'dev_address_data'
const BETA_ADDRESS_DATA_COLLECTION = 'beta_address_data'

export const getFirebaseUidOrError = (firebaseApp: ReactNativeFirebase.FirebaseApp): string => {
  const uid = firebaseApp.auth().currentUser?.uid
  if (!uid) {
    throw new Error('User must be signed in to Firebase before accessing Firestore')
  }
  return uid
}

export const getFirestoreUidRef = (
  firebaseApp: ReactNativeFirebase.FirebaseApp,
  address: Address
): FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData> =>
  firestore(firebaseApp)
    .collection(getAddressDataCollectionFromBundleId())
    .doc('address_uid_mapping')
    .collection(address.toLowerCase())
    .doc('firebase')

export const getFirestoreMetadataRef = (
  firebaseApp: ReactNativeFirebase.FirebaseApp,
  address: Address,
  pushId: string
): FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData> =>
  firestore(firebaseApp)
    .collection(getAddressDataCollectionFromBundleId())
    .doc('metadata')
    .collection(address.toLowerCase())
    .doc('onesignal_uids')
    .collection(pushId)
    .doc('data')

export function getAddressDataCollectionFromBundleId(): string {
  if (isDevBuild()) {
    return DEV_ADDRESS_DATA_COLLECTION
  }
  if (isBetaBuild()) {
    return BETA_ADDRESS_DATA_COLLECTION
  }
  return ADDRESS_DATA_COLLECTION
}
