import { Signer } from 'ethers'

import { Account, AccountType } from '../types'

export class SignerManager {
  private readonly _signers: Record<Address, Signer> = {}

  async getSignerForAccount(account: Account): Promise<Signer | undefined> {
    if (this._signers[account.address]) {
      return this._signers[account.address]
    }

    if (account.type === AccountType.SignerMnemonic) {
      // const addresses = await getAddressesForStoredPrivateKeys()
      // if (!addresses.includes(account.address)) {
      //   throw Error('No private key found for address')
      // }
      // this._signers[account.address] = new NativeSigner(account.address)
      return this._signers[account.address]
    }

    throw Error('Signer type currently unsupported')
  }
}
