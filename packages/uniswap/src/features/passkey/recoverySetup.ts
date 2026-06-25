import { generateRandomBytes } from '@universe/cryptography'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { deriveArgon2 } from 'uniswap/src/features/passkey/deriveArgon2'
import {
  blindPin,
  combineAndDeriveKey,
  encryptAuthKey,
  finalizeOprf,
  generateAuthKeyPair,
  hashAuthMethodId,
  SALT_LENGTH,
  zeroBuffers,
} from 'uniswap/src/features/passkey/pinCrypto'
import { storeEncryptedBlob } from 'uniswap/src/features/passkey/privyBlobStore'
import { logger } from 'utilities/src/logger/logger'

export type SetupProgress =
  | 'generating_keys'
  | 'oprf'
  | 'deriving'
  | 'encrypting'
  | 'storing'
  | 'challenging'
  | 'authenticating'
  | 'registering'

export async function encryptAndStoreRecovery({
  pin,
  email,
  accessToken,
  privyAppId,
  onProgress,
}: {
  pin: string
  email: string
  accessToken: string
  privyAppId: string
  onProgress?: (step: SetupProgress) => void
}): Promise<{ publicKey: string; authMethodId: string; encryptedKeyId: string }> {
  let privateKey: Uint8Array | undefined
  let finalKey: Uint8Array | undefined
  let oprfOutput: Uint8Array | undefined
  let pinKey: Uint8Array | undefined

  try {
    // 1. Generate auth key pair
    onProgress?.('generating_keys')
    const keyPair = await generateAuthKeyPair()
    privateKey = keyPair.privateKey
    const publicKey = keyPair.publicKey
    const authMethodId = hashAuthMethodId(email)

    // 2. Generate random salts
    const salt1 = generateRandomBytes(SALT_LENGTH)
    const salt2 = generateRandomBytes(SALT_LENGTH)

    // 3. OPRF: blind → evaluate → finalize
    onProgress?.('oprf')
    const { blindedElement, blindState } = await blindPin(pin)
    const oprfResponse = await EmbeddedWalletApiClient.fetchOprfEvaluate(
      {
        blindedElement,
        authMethodId,
      },
      accessToken,
    )
    if (!oprfResponse.evaluatedElement) {
      throw new Error(oprfResponse.errorMessage ?? 'OPRF evaluation failed')
    }
    oprfOutput = await finalizeOprf(blindState, oprfResponse.evaluatedElement)

    // 4. Key derivation: Argon2id + HKDF
    onProgress?.('deriving')
    pinKey = await deriveArgon2(pin, salt1)
    finalKey = combineAndDeriveKey({ oprfOutput, pinKey, salt2 })

    // 5. Encrypt auth private key
    onProgress?.('encrypting')
    const blob = encryptAuthKey({ finalKey, authPrivateKey: privateKey, salt1, salt2 })

    // 6. Store blob at Privy
    onProgress?.('storing')
    const { keyId } = await storeEncryptedBlob({ accessToken, blob, privyAppId })

    return { publicKey, authMethodId, encryptedKeyId: keyId }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'recoverySetup.ts', function: 'encryptAndStoreRecovery' },
    })
    throw error
  } finally {
    // Zero sensitive material regardless of success or failure
    zeroBuffers(privateKey, finalKey, oprfOutput, pinKey)
  }
}
