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

/**
 * Thrown when OprfEvaluate rejects with a user-facing `errorMessage` (rate limited / banned PIN).
 * The message is safe to display verbatim; callers should surface it instead of a generic error.
 */
export class RecoveryOprfError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RecoveryOprfError'
  }
}

export async function encryptAndStoreRecovery({
  pin,
  email,
  accessToken,
  privyAppId,
  rotate = false,
  retainPrivateKey = false,
  onProgress,
}: {
  pin: string
  email: string
  accessToken: string
  privyAppId: string
  // Rotation: force a v2 setup-style OprfEvaluate with a fresh nonce even though a v1 config exists.
  rotate?: boolean
  // Return a copy of the generated auth private key so the caller can immediately reuse it (e.g. to
  // register a device passkey right after a rotation). The internal key is still zeroed; the caller
  // owns zeroing the returned copy.
  retainPrivateKey?: boolean
  onProgress?: (step: SetupProgress) => void
}): Promise<{ publicKey: string; authMethodId: string; encryptedKeyId: string; authPrivateKey?: Uint8Array }> {
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
        rotate,
      },
      accessToken,
    )
    if (!oprfResponse.evaluatedElement) {
      // A server errorMessage (rate limit / banned PIN) is user-facing; surface it via a typed error.
      if (oprfResponse.errorMessage) {
        throw new RecoveryOprfError(oprfResponse.errorMessage)
      }
      throw new Error('OPRF evaluation failed')
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

    return {
      publicKey,
      authMethodId,
      encryptedKeyId: keyId,
      // Copy before the finally zeros the original.
      authPrivateKey: retainPrivateKey ? privateKey.slice() : undefined,
    }
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
