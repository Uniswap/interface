import { AccountMeta, AccountType } from 'uniswap/src/features/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { NativeSigner } from 'wallet/src/features/wallet/signing/NativeSigner'

/** Manages initialized ethers.Signers across the app */
export class SignerManager {
  private readonly signers: Record<Address, NativeSigner> = {}

  async getSignerForAccount(account: AccountMeta): Promise<NativeSigner> {
    const signer = this.signers[account.address]
    if (signer) {
      return signer
    }

    if (account.type === AccountType.SignerMnemonic) {
      const addresses = await Keyring.getAddressesForStoredPrivateKeys()
      if (!addresses.includes(account.address)) {
        throw new Error('No private key found for address')
      }
      const newSigner = new NativeSigner(account.address)
      this.signers[account.address] = newSigner
      return newSigner
    }

    throw new Error('No signer found for account')
  }
}
