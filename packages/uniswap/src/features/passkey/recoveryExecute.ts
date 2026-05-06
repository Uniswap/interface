import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { base64urlToBase64 } from '@universe/encoding'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { deriveArgon2InWorker } from 'uniswap/src/features/passkey/deriveArgon2InWorker'
import {
  AES_KEY_LENGTH,
  blindPin,
  decryptAuthKey,
  finalizeOprf,
  HKDF_INFO,
  hashAuthMethodId,
  parseBlob,
  signWithAuthKey,
  zeroBuffers,
} from 'uniswap/src/features/passkey/pinCrypto'
import { fetchEncryptedBlob } from 'uniswap/src/features/passkey/privyBlobStore'
import { logger } from 'utilities/src/logger/logger'

export async function attemptPinDecryption({
  pin,
  email,
  accessToken,
  encryptedKeyId,
  privyAppId,
}: {
  pin: string
  email: string
  accessToken: string
  encryptedKeyId: string
  privyAppId: string
}): Promise<
  | { success: true; authPrivateKey: Uint8Array }
  | {
      success: false
      error: 'wrong_pin' | 'rate_limited' | 'no_blobs'
      cooldownSeconds?: number
      errorMessage?: string
    }
> {
  try {
    const authMethodId = hashAuthMethodId(email)

    // 1. Fetch encrypted blob from Privy
    let blob: string
    try {
      blob = await fetchEncryptedBlob({ accessToken, keyId: encryptedKeyId, privyAppId })
    } catch {
      return { success: false, error: 'no_blobs', errorMessage: 'No recovery data found for this account.' }
    }

    // 2. OPRF: blind → evaluate → finalize
    const { blindedElement, blindState } = await blindPin(pin)
    const oprfResponse = await EmbeddedWalletApiClient.fetchOprfEvaluate({
      blindedElement,
      isRecovery: true,
      authMethodId,
    })

    if (oprfResponse.errorMessage || !oprfResponse.evaluatedElement) {
      return { success: false, error: 'rate_limited', errorMessage: oprfResponse.errorMessage }
    }

    const oprfOutput = await finalizeOprf(blindState, oprfResponse.evaluatedElement)

    // 3. Attempt decryption
    let pinKey: Uint8Array | undefined
    let ikm: Uint8Array | undefined
    let finalKey: Uint8Array | undefined
    try {
      const { salt1, salt2, iv, ciphertextWithTag } = parseBlob(blob)

      // Argon2id in worker + HKDF (errors here should propagate, not be treated as wrong PIN)
      pinKey = await deriveArgon2InWorker(pin, salt1)
      ikm = new Uint8Array(oprfOutput.length + pinKey.length)
      ikm.set(oprfOutput, 0)
      ikm.set(pinKey, oprfOutput.length)
      finalKey = hkdf(sha256, ikm, salt2, HKDF_INFO, AES_KEY_LENGTH)

      // Try decryption — throws on GCM tag mismatch (wrong PIN)
      let authPrivateKey: Uint8Array
      try {
        authPrivateKey = decryptAuthKey({ finalKey, iv, ciphertextWithTag })
      } catch {
        // GCM tag mismatch — wrong PIN
        const reportResponse = await EmbeddedWalletApiClient.fetchReportDecryptionResult({
          success: false,
          authMethodId,
        })

        return {
          success: false,
          error: 'wrong_pin',
          cooldownSeconds: reportResponse.cooldownSeconds > 0 ? reportResponse.cooldownSeconds : undefined,
          errorMessage: reportResponse.errorMessage,
        }
      }

      return { success: true, authPrivateKey }
    } finally {
      zeroBuffers(pinKey, ikm, finalKey, oprfOutput)
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'recoveryExecute.ts', function: 'attemptPinDecryption' },
    })
    throw error
  }
}

export async function executeRecovery({
  authPrivateKey,
  authMethodId,
  newPasskeyCredential,
  newPasskeyPublicKey,
  generateAuthorizationSignature,
}: {
  authPrivateKey: Uint8Array
  authMethodId: string
  newPasskeyCredential: string
  newPasskeyPublicKey: string
  generateAuthorizationSignature: (payload: object) => Promise<{ signature: string }>
}): Promise<{ walletAddress: string; credentialId: string; walletId: string }> {
  try {
    // 1. Report successful decryption with new passkey public key → get signing payload
    const reportResponse = await EmbeddedWalletApiClient.fetchReportDecryptionResult({
      success: true,
      authMethodId,
      newPasskeyPublicKey,
    })

    if (!reportResponse.signingPayload) {
      throw new Error('Server did not return a signing payload')
    }

    // 2. Decode signing payload → canonical JSON string + bytes
    // Server sends base64url-encoded canonical JSON; fall back to raw UTF-8 if not valid base64
    let payloadJson: string
    try {
      payloadJson = atob(base64urlToBase64(reportResponse.signingPayload))
    } catch {
      // Payload is not base64url — treat as raw JSON string
      payloadJson = reportResponse.signingPayload
    }
    const payloadBytes = new TextEncoder().encode(payloadJson)
    const payloadObject = JSON.parse(payloadJson)

    const authKeySignature = signWithAuthKey(authPrivateKey, payloadBytes) // sig2
    const { signature: recoveryAuthSignature } = await generateAuthorizationSignature(payloadObject) // sig1

    // 3. Execute recovery with authorization signature + auth key signature
    const response = await EmbeddedWalletApiClient.fetchExecuteRecovery({
      authMethodId,
      newCredential: newPasskeyCredential,
      authKeySignature,
      recoveryAuthSignature,
    })

    if (!response.walletAddress || !response.credentialId || !response.walletId) {
      throw new Error('Recovery execution failed: missing walletAddress, credentialId, or walletId')
    }

    return { walletAddress: response.walletAddress, credentialId: response.credentialId, walletId: response.walletId }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'recoveryExecute.ts', function: 'executeRecovery' },
    })
    throw error
  } finally {
    zeroBuffers(authPrivateKey)
  }
}
