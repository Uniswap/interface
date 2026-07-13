import { Chacha20Poly1305 } from '@hpke/chacha20poly1305'
import { CipherSuite, DhkemP256HkdfSha256, HkdfSha256 } from '@hpke/core'
import { base64ToUint8, uint8ToBase64 } from '@universe/encoding'
import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { exportEncryptedSeedPhrase, type GetExportCredentialFn } from 'uniswap/src/features/passkey/embeddedWallet'
import { executeRecoveryExport } from 'uniswap/src/features/passkey/recoveryExecute'

/**
 * Generate an ephemeral P-256 HPKE keypair for one-shot seed phrase export.
 * SPKI-encoded public key is what the backend expects as `encryption_key`.
 */
export async function generateHpkeKeypair(): Promise<{
  suite: CipherSuite
  keypair: CryptoKeyPair
  publicKeyBase64: string
}> {
  const kem = new DhkemP256HkdfSha256()
  const keypair = await kem.generateKeyPair()
  const spki = await crypto.subtle.exportKey('spki', keypair.publicKey)
  const publicKeyBase64 = uint8ToBase64(new Uint8Array(spki))
  const suite = new CipherSuite({ kem, kdf: new HkdfSha256(), aead: new Chacha20Poly1305() })
  return { suite, keypair, publicKeyBase64 }
}

/**
 * Decrypt an HPKE ciphertext produced by the backend for the ephemeral public key of
 * `keypair`. Returns the plaintext mnemonic as a UTF-8 string.
 */
export async function decryptHpkeCiphertext({
  suite,
  keypair,
  ciphertext,
  encapsulatedKey,
}: {
  suite: CipherSuite
  keypair: CryptoKeyPair
  ciphertext: string
  encapsulatedKey: string
}): Promise<string> {
  const enc = base64ToUint8(encapsulatedKey)
  const ct = base64ToUint8(ciphertext)
  const recipientCtx = await suite.createRecipientContext({ recipientKey: keypair, enc })
  const plaintext = await recipientCtx.open(ct)
  return new TextDecoder().decode(plaintext)
}

/**
 * Exports the seed phrase for an embedded wallet using HPKE encryption.
 *
 * When walletId is known (web), a single passkey ceremony is performed for the export.
 * When walletId is not known (mobile/extension graduation), a WalletSignIn is performed
 * first using the provided signinCredential to retrieve the walletId, then a second
 * passkey ceremony handles the export.
 *
 * @param walletId - The wallet ID (optional; if omitted, signinCredential is required)
 * @param signinCredential - Pre-authenticated credential from a WALLET_SIGNIN challenge
 * @param getCredential - Override the export ceremony; extension delegates to a web-app popup.
 */
export async function exportSeedPhrase({
  walletId,
  signinCredential,
  getCredential,
}: {
  walletId?: string
  signinCredential?: string
  getCredential?: GetExportCredentialFn
} = {}): Promise<string | undefined> {
  let resolvedWalletId = walletId
  let resolvedWalletAddress: string | undefined
  if (!resolvedWalletId) {
    if (!signinCredential) {
      throw new Error('Either walletId or signinCredential is required for seed phrase export')
    }
    const signinResp = await EmbeddedWalletApiClient.fetchWalletSigninRequest({ credential: signinCredential })
    resolvedWalletId = signinResp.walletId
    resolvedWalletAddress = signinResp.walletAddress
    if (!resolvedWalletId) {
      return undefined
    }
  }

  const { suite, keypair, publicKeyBase64 } = await generateHpkeKeypair()

  const result = await exportEncryptedSeedPhrase({
    encryptionKey: publicKeyBase64,
    walletId: resolvedWalletId,
    getCredential,
    walletAddress: resolvedWalletAddress,
  })
  // Guard the legacy API shape: `signing.ts` maps `encryptedSeedPhrase` to
  // `ciphertext` with an empty `encapsulatedKey`. Without this guard,
  // `createRecipientContext` would throw on the empty `enc` and the caller
  // would see a generic error with no signal that the API is on the old shape.
  if (!result || !result.ciphertext || !result.encapsulatedKey) {
    return undefined
  }

  return decryptHpkeCiphertext({
    suite,
    keypair,
    ciphertext: result.ciphertext,
    encapsulatedKey: result.encapsulatedKey,
  })
}

/**
 * Graduation variant of {@link exportSeedPhrase}: authenticate via recovery method
 * (email/OAuth + PIN) instead of a passkey ceremony. Used by mobile/extension when no
 * passkey is registered for the current device. `authPrivateKey` is the raw P-256 key
 * recovered by {@link attemptPinDecryption}; this function zeroes it via `executeRecoveryExport`.
 */
export async function exportSeedPhraseWithRecovery({
  authPrivateKey,
  authMethodId,
  accessToken,
  generateAuthorizationSignature,
}: {
  authPrivateKey: Uint8Array
  authMethodId: string
  accessToken: string
  generateAuthorizationSignature: (payload: object) => Promise<{ signature: string }>
}): Promise<string> {
  const { suite, keypair, publicKeyBase64 } = await generateHpkeKeypair()
  const { ciphertext, encapsulatedKey } = await executeRecoveryExport({
    authPrivateKey,
    authMethodId,
    encryptionKey: publicKeyBase64,
    accessToken,
    generateAuthorizationSignature,
  })
  return decryptHpkeCiphertext({ suite, keypair, ciphertext, encapsulatedKey })
}
