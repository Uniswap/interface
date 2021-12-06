import { Signer, Wallet } from 'ethers'
import { NativeSigner } from 'src/features/wallet/accounts/NativeSigner'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { getAddressesForStoredPrivateKeys } from 'src/lib/RNEthersRs'

export class SignerManager {
  private readonly _signers: Record<Address, Signer> = {}

  async getSignerForAccount(account: Account) {
    if (this._signers[account.address]) {
      return this._signers[account.address]
    }

    if (account.type === AccountType.native) {
      const addresses = await getAddressesForStoredPrivateKeys()
      if (!addresses.includes(account.address)) {
        throw Error('No private key found for address')
      }
      this._signers[account.address] = new NativeSigner(account.address)
      return this._signers[account.address]
    }

    if (account.type === AccountType.local) {
      if (account.privateKey) {
        this._signers[account.address] = new Wallet(account.privateKey)
        return this._signers[account.address]
      } else if (account.mnemonic) {
        this._signers[account.address] = Wallet.fromMnemonic(account.mnemonic)
        return this._signers[account.address]
      } else {
        throw new Error('Account must have private key or mnemonic')
      }
    }

    throw Error('Signer type currently unsupported')
  }
}
