import { Signer } from 'ethers'
import { logger } from 'wallet/src/features/logger/logger'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { NativeSigner } from './NativeSigner'

/** Manages initialized ethers.Signers across the app */
export class SignerManager {
  private readonly signers: Record<Address, Signer> = {}

  async getSignerForAccount(account: Account): Promise<Signer | undefined> {
    try {
      if (this.signers[account.address]) {
        return this.signers[account.address]
      }

      if (account.type === AccountType.SignerMnemonic) {
        const addresses = await Keyring.getAddressesForStoredPrivateKeys()
        if (!addresses.includes(account.address)) {
          throw new Error('No private key found for address')
        }
        this.signers[account.address] = new NativeSigner(account.address)
        return this.signers[account.address]
      }

      throw new Error('No signer found for account')
    } catch (error) {
      logger.error('Unable to retrieve signer for account', {
        tags: {
          level: 'fatal',
          file: 'SignerManager',
          function: 'getSignerForAccount',
          account: JSON.stringify(account),
          error: JSON.stringify(error),
        },
      })
    }
  }
}
