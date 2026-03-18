import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export async function fetchSeedPhrase(passkeyCredential: string): Promise<string> {
  const publicKeyBase64 = await Keyring.generateKeyPairForPasskeyWallet()
  const seedPhraseResp = await EmbeddedWalletApiClient.fetchExportSeedPhraseRequest({
    encryptionKey: publicKeyBase64,
    credential: passkeyCredential,
  })
  return await Keyring.decryptMnemonicForPasskey(seedPhraseResp.encryptedSeedPhrase, publicKeyBase64)
}
