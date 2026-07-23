import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { deriveArgon2 } from 'uniswap/src/features/passkey/deriveArgon2'
import {
  blindPin,
  combineAndDeriveKey,
  decryptAuthKey,
  finalizeOprf,
  hashAuthMethodId,
  parseBlob,
  zeroBuffers,
} from 'uniswap/src/features/passkey/pinCrypto'
import { logger } from 'utilities/src/logger/logger'

/**
 * Enforces "cannot reuse your last passcode" during rotation: runs a v1 OprfEvaluate and tries to
 * decrypt the existing (old) blob with the candidate PIN. Decrypt succeeds ⇒ same PIN ⇒ reused.
 *
 * Never reports to the backend (that would burn the recovery cooldown) and fails open — an
 * inconclusive check returns false rather than blocking the rotation.
 */
export async function checkPinReuse({
  pin,
  email,
  accessToken,
  encryptedBlob,
}: {
  pin: string
  email: string
  accessToken: string
  encryptedBlob: string
}): Promise<boolean> {
  let pinKey: Uint8Array | undefined
  let oprfOutput: Uint8Array | undefined
  let finalKey: Uint8Array | undefined
  let authPrivateKey: Uint8Array | undefined
  try {
    const authMethodId = hashAuthMethodId(email)
    const { blindedElement, blindState } = await blindPin(pin)
    const oprfResponse = await EmbeddedWalletApiClient.fetchOprfEvaluate({ blindedElement, authMethodId }, accessToken)
    if (oprfResponse.errorMessage || !oprfResponse.evaluatedElement) {
      return false
    }
    oprfOutput = await finalizeOprf(blindState, oprfResponse.evaluatedElement)

    const { salt1, salt2, iv, ciphertextWithTag } = parseBlob(encryptedBlob)
    pinKey = await deriveArgon2(pin, salt1)
    finalKey = combineAndDeriveKey({ oprfOutput, pinKey, salt2 })

    try {
      authPrivateKey = decryptAuthKey({ finalKey, iv, ciphertextWithTag })
      return true
    } catch {
      return false // GCM tag mismatch → different PIN
    }
  } catch (error) {
    logger.error(error, { tags: { file: 'checkPinReuse', function: 'checkPinReuse' } })
    return false
  } finally {
    zeroBuffers(pinKey, oprfOutput, finalKey, authPrivateKey)
  }
}
