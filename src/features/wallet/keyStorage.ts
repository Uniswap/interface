import * as SecureStore from 'expo-secure-store'

const ACCOUNT_KEY_SERVICE = 'AccountKey'

export function saveKeyForAddress(address: Address, privateKey: string) {
  return SecureStore.setItemAsync(address, privateKey, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
    keychainService: ACCOUNT_KEY_SERVICE,
  })
}

export async function retrieveKeyForAddress(address: Address) {
  let result = await SecureStore.getItemAsync(address, {
    keychainService: ACCOUNT_KEY_SERVICE,
  })
  if (!result) {
    throw new Error('No value stored for key')
  }
  return result
}
