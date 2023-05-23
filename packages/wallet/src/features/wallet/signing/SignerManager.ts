import { Signer } from 'ethers'
import { logger } from 'wallet/src/features/logger/logger'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { NativeSigner } from './NativeSigner'

/** Manages initialized ethers.Signers across the app */
export class SignerManager {
  private readonly signers: Record<Address, Signer> = {}

  async getSignerForAccount(account: Account): Promise<Signer | undefined> {
    if (this.signers[account.address]) {
      return this.signers[account.address]
    }

    if (account.type === AccountType.SignerMnemonic) {
      const addresses = await Keyring.getAddressesForStoredPrivateKeys()
      if (!addresses.includes(account.address)) {
        throw Error('No private key found for address')
      }
      this.signers[account.address] = new NativeSigner(account.address)
      return this.signers[account.address]
    }

    logger.error(
      'SignerManager',
      'getSignerForAccount',
      `no signer found for account: ${account.address} of type: ${account.type}`
    )

    throw Error('Signer type currently unsupported')
  }
}
