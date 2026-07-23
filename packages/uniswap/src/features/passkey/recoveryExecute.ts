import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { base64urlToBase64 } from '@universe/encoding'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { deriveArgon2 } from 'uniswap/src/features/passkey/deriveArgon2'
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
import { logger } from 'utilities/src/logger/logger'

// Privy rate-limits `GET /encrypted_authorization_keys/:keyId`; callers fetch the
// blob once and pass it in so PIN retries don't burn against the limit.
export async function attemptPinDecryption({
  pin,
  email,
  accessToken,
  encryptedBlob,
}: {
  pin: string
  email: string
  accessToken: string
  encryptedBlob: string
}): Promise<
  | { success: true; authPrivateKey: Uint8Array }
  | {
      success: false
      error: 'wrong_pin' | 'rate_limited'
      cooldownSeconds?: number
      errorMessage?: string
    }
> {
  try {
    const authMethodId = hashAuthMethodId(email)

    // 1. OPRF: blind → evaluate → finalize
    const { blindedElement, blindState } = await blindPin(pin)
    const oprfResponse = await EmbeddedWalletApiClient.fetchOprfEvaluate(
      {
        blindedElement,
        authMethodId,
      },
      accessToken,
    )

    if (oprfResponse.errorMessage || !oprfResponse.evaluatedElement) {
      return { success: false, error: 'rate_limited', errorMessage: oprfResponse.errorMessage }
    }

    const oprfOutput = await finalizeOprf(blindState, oprfResponse.evaluatedElement)

    // 2. Attempt decryption
    let pinKey: Uint8Array | undefined
    let ikm: Uint8Array | undefined
    let finalKey: Uint8Array | undefined
    try {
      const { salt1, salt2, iv, ciphertextWithTag } = parseBlob(encryptedBlob)

      // Argon2id + HKDF (errors here should
      // propagate, not be treated as wrong PIN)
      pinKey = await deriveArgon2(pin, salt1)
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
        const reportResponse = await EmbeddedWalletApiClient.fetchReportDecryptionResult(
          {
            success: false,
            authMethodId,
          },
          accessToken,
        )

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

// Server sends a base64url-encoded canonical JSON string. Fails loudly on malformed input
// rather than falling back to raw UTF-8 — a decode failure here means the server response
// is unexpectedly shaped and we want to surface that, not silently continue.
export function decodeSigningPayload(payload: string): { payloadBytes: Uint8Array; payloadObject: object } {
  const payloadJson = atob(base64urlToBase64(payload))
  const parsed: unknown = JSON.parse(payloadJson)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Decoded signing payload is not a JSON object')
  }
  return {
    payloadBytes: new TextEncoder().encode(payloadJson),
    payloadObject: parsed,
  }
}

export async function executeRecovery({
  authPrivateKey,
  authMethodId,
  accessToken,
  newPasskeyCredential,
  newPasskeyPublicKey,
  generateAuthorizationSignature,
}: {
  authPrivateKey: Uint8Array
  authMethodId: string
  accessToken: string
  newPasskeyCredential: string
  newPasskeyPublicKey: string
  generateAuthorizationSignature: (payload: object) => Promise<{ signature: string }>
}): Promise<{ walletAddress: string; credentialId: string; walletId: string }> {
  try {
    // 1. Report successful decryption with new passkey public key → get signing payload
    const reportResponse = await EmbeddedWalletApiClient.fetchReportDecryptionResult(
      {
        success: true,
        authMethodId,
        newPasskeyPublicKey,
      },
      accessToken,
    )

    if (!reportResponse.signingPayload) {
      throw new Error('Server did not return a signing payload')
    }

    const { payloadBytes, payloadObject } = decodeSigningPayload(reportResponse.signingPayload)

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

/**
 * Graduation export: use the recovered PIN-derived auth key (from `attemptPinDecryption` —
 * same `authPrivateKey` concept as `executeRecovery`) to export the seed phrase
 * HPKE-encrypted to a caller-provided ephemeral public key. Caller is responsible for HPKE
 * decryption. Used by mobile/extension graduation flows where the user doesn't have a
 * passkey on the current device.
 *
 * Mirrors `executeRecovery`'s dual-signature pattern: PIN-derived authKey ECDSA (sig2) +
 * Privy authorization (sig1). Zeros `authPrivateKey` on exit.
 */
export async function executeRecoveryExport({
  authPrivateKey,
  authMethodId,
  encryptionKey,
  accessToken,
  generateAuthorizationSignature,
}: {
  authPrivateKey: Uint8Array
  authMethodId: string
  encryptionKey: string
  accessToken: string
  generateAuthorizationSignature: (payload: object) => Promise<{ signature: string }>
}): Promise<{ ciphertext: string; encapsulatedKey: string }> {
  try {
    const reportResponse = await EmbeddedWalletApiClient.fetchReportDecryptionResult(
      {
        success: true,
        authMethodId,
        encryptionKey,
      },
      accessToken,
    )

    const { exportSigningPayload } = reportResponse

    if (!exportSigningPayload) {
      throw new Error('Server did not return an export signing payload')
    }

    const { payloadBytes, payloadObject } = decodeSigningPayload(exportSigningPayload)

    const authKeySignature = signWithAuthKey(authPrivateKey, payloadBytes)
    const { signature: recoveryAuthSignature } = await generateAuthorizationSignature(payloadObject)

    return await EmbeddedWalletApiClient.fetchExportSeedPhraseWithRecovery({
      authMethodId,
      encryptionKey,
      authKeySignature,
      recoveryAuthSignature,
    })
  } catch (error) {
    logger.error(error, {
      tags: { file: 'recoveryExecute.ts', function: 'executeRecoveryExport' },
    })
    throw error
  } finally {
    zeroBuffers(authPrivateKey)
  }
}
