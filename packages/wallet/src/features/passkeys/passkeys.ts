import { exportEncryptedSeedPhrase } from 'uniswap/src/features/passkey/embeddedWallet'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export async function exportSeedPhrase(): Promise<string | undefined> {
  const publicKeyBase64 = await Keyring.generateKeyPairForPasskeyWallet()
  const encryptedMnemonic = await exportEncryptedSeedPhrase(publicKeyBase64)
  return encryptedMnemonic ? await Keyring.decryptMnemonicForPasskey(encryptedMnemonic, publicKeyBase64) : undefined
}
