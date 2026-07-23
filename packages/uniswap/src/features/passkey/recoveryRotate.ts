import {
  Action,
  AuthenticationTypes,
} from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import type { RecoveryAuthMethodType } from 'uniswap/src/features/passkey/embeddedWallet'
import { signWithAuthKey, zeroBuffers } from 'uniswap/src/features/passkey/pinCrypto'
import { decodeSigningPayload } from 'uniswap/src/features/passkey/recoveryExecute'
import { encryptAndStoreRecovery } from 'uniswap/src/features/passkey/recoverySetup'
import { logger } from 'utilities/src/logger/logger'

// Challenge(SETUP_RECOVERY) returns the base64url swap payload as the WebAuthn `challenge`; the
// recovery-auth path reads it directly (no passkey ceremony).
function extractSwapPayload(challengeOptions: string | undefined): string {
  if (!challengeOptions) {
    throw new Error('No challenge options for SETUP_RECOVERY rotation')
  }
  const parsed = JSON.parse(challengeOptions) as { challenge?: unknown }
  if (typeof parsed.challenge !== 'string' || !parsed.challenge) {
    throw new Error('SETUP_RECOVERY challenge is missing the swap payload')
  }
  return parsed.challenge
}

export interface RotationResult {
  authMethodId: string
  encryptedKeyId: string
  // The new v2 recovery auth key, handed back so the caller can register a device passkey
  // immediately (executeRecovery) without re-deriving it. Caller owns zeroing it.
  newAuthPrivateKey: Uint8Array
}

/**
 * Passkey-less v1→v2 rotation (recovery-auth). Re-keys an existing v1 backup login to v2 with no
 * passkey: encrypts a fresh blob under v2, then authorizes the owner-quorum `key_quorum_ids` swap
 * with the recovered v1 auth key (sig2) and the Privy user authorization (sig1). Zeros the
 * recovered v1 key on exit and returns the new v2 auth key. Only valid when the current config is
 * v1 and the server flag `ALLOW_V1_RECOVERY_AUTH_ROTATION` is on; the server rejects it otherwise.
 */
export async function rotateRecoveryWithRecoveryAuth({
  recoveredAuthPrivateKey,
  newPin,
  email,
  accessToken,
  privyAppId,
  walletId,
  privyUserId,
  authMethodType,
  generateAuthorizationSignature,
}: {
  // v1 auth key recovered by decrypting the old blob with the old passcode.
  recoveredAuthPrivateKey: Uint8Array
  newPin: string
  email: string
  accessToken: string
  privyAppId: string
  walletId: string
  privyUserId: string
  authMethodType: RecoveryAuthMethodType
  generateAuthorizationSignature: (payload: object) => Promise<{ signature: string }>
}): Promise<RotationResult> {
  // Zeroed in `finally` unless ownership is handed to the caller.
  let newAuthPrivateKey: Uint8Array | undefined
  try {
    // New v2 blob (rotate → fresh v2 nonce despite the v1 config); retain the key for the passkey step.
    const encrypted = await encryptAndStoreRecovery({
      pin: newPin,
      email,
      accessToken,
      privyAppId,
      rotate: true,
      retainPrivateKey: true,
    })
    if (!encrypted.authPrivateKey) {
      throw new Error('Rotation did not return the new auth key')
    }
    newAuthPrivateKey = encrypted.authPrivateKey

    // Challenge pre-creates the new v2 recovery quorum and returns the key_quorum_ids swap payload.
    const challenge = await EmbeddedWalletApiClient.fetchChallengeRequest({
      type: AuthenticationTypes.PASSKEY_AUTHENTICATION,
      action: Action.SETUP_RECOVERY,
      walletId,
      authPublicKey: encrypted.publicKey,
      privyUserId,
    })
    const swapPayload = extractSwapPayload(challenge.challengeOptions)

    // Authorize the swap with the recovered v1 auth key (sig2) + Privy user JWT (sig1).
    const { payloadBytes, payloadObject } = decodeSigningPayload(swapPayload)
    const authKeySignature = signWithAuthKey(recoveredAuthPrivateKey, payloadBytes)
    const { signature: recoveryAuthSignature } = await generateAuthorizationSignature(payloadObject)

    const result = await EmbeddedWalletApiClient.fetchSetupRecovery({
      authMethodId: encrypted.authMethodId,
      authMethodType,
      authMethodIdentifier: email,
      encryptedKeyId: encrypted.encryptedKeyId,
      authKeySignature,
      recoveryAuthSignature,
      signingPayload: swapPayload,
    })
    if (!result.success) {
      throw new Error('Backend failed to rotate recovery quorum')
    }

    const rotation: RotationResult = {
      authMethodId: encrypted.authMethodId,
      encryptedKeyId: encrypted.encryptedKeyId,
      newAuthPrivateKey,
    }
    newAuthPrivateKey = undefined // ownership transfers to the caller
    return rotation
  } catch (error) {
    logger.error(error, { tags: { file: 'recoveryRotate', function: 'rotateRecoveryWithRecoveryAuth' } })
    throw error
  } finally {
    zeroBuffers(recoveredAuthPrivateKey, newAuthPrivateKey)
  }
}
