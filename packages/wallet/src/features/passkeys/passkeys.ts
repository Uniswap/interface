import type { GetExportCredentialFn } from 'uniswap/src/features/passkey/embeddedWallet'
import { exportSeedPhrase } from 'uniswap/src/features/passkey/utils'

/**
 * Graduation-path wrapper: takes a pre-authenticated WALLET_SIGNIN credential, uses it to resolve
 * `walletId`, then runs a second passkey ceremony to export the HPKE-encrypted seed phrase.
 * Throws on failure (caller expects a valid mnemonic). Mobile + extension call this from their
 * import flows.
 */
export async function exportSeedPhraseForGraduation(
  passkeyCredential: string,
  getCredential?: GetExportCredentialFn,
): Promise<string> {
  const seedPhrase = await exportSeedPhrase({ signinCredential: passkeyCredential, getCredential })
  if (!seedPhrase) {
    throw new Error('Failed to export seed phrase')
  }
  return seedPhrase
}
