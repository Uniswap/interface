import { logger } from 'utilities/src/logger/logger'
import { SecretPayload } from 'wallet/src/features/wallet/Keyring/crypto'
import { PersistedStorage } from 'wallet/src/utils/persistedStorage'

export type BiometricUnlockStorageData = {
  credentialId: string
  transports: AuthenticatorTransport[]
  secretPayload: Omit<SecretPayload, 'ciphertext'> & { ciphertext: string }
}

const BIOMETRIC_UNLOCK_STORAGE_KEY = 'biometricUnlock'

const storage = new PersistedStorage('local')

interface IBiometricUnlockStorage {
  set(data: BiometricUnlockStorageData): Promise<void>
  get(): Promise<BiometricUnlockStorageData | null>
  remove(): Promise<void>
}

export const BiometricUnlockStorage: IBiometricUnlockStorage = {
  set: async (data: BiometricUnlockStorageData) => {
    await storage.setItem(BIOMETRIC_UNLOCK_STORAGE_KEY, JSON.stringify(data))
  },
  remove: async () => {
    await storage.removeItem(BIOMETRIC_UNLOCK_STORAGE_KEY)
  },
  get: async () => {
    const data = await storage.getItem(BIOMETRIC_UNLOCK_STORAGE_KEY)

    try {
      return data ? (JSON.parse(data) as BiometricUnlockStorageData) : null
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'BiometricUnlockStorage.ts',
          function: 'BiometricUnlockStorage.get',
        },
      })

      return null
    }
  },
}
