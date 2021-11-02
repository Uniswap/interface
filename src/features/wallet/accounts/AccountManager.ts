import { Account } from 'src/features/wallet/accounts/types'
import { normalizeAddress } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'

export class AccountManager {
  private readonly _accounts: Record<Address, Account> = {}

  addAccount(newAccount: Account) {
    const id = normalizeAddress(newAccount.address)
    if (this._accounts[id]) {
      throw new Error(`Attempting to overwrite existing account for ${newAccount}`)
    }
    this._accounts[id] = newAccount
  }

  removeAccount(address: Address) {
    const id = normalizeAddress(address)
    if (!this._accounts[id]) {
      logger.warn(
        'AccountManager',
        'removeAccount',
        'Attempting to remove non-existing account',
        address
      )
      return
    }
    delete this._accounts[id]
  }

  getAccount(address: Address) {
    const id = normalizeAddress(address)
    if (!this._accounts[id]) {
      logger.warn('AccountManager', 'getAccount', 'Attempting to get missing account', address)
      return null
    }
    return this._accounts[id]
  }

  listAccounts() {
    return Object.values(this._accounts).map((a) => ({
      type: a.type,
      address: a.address,
    }))
  }
}
