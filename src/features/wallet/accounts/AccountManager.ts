import { SupportedChainId } from 'src/constants/chains'
import { Account } from 'src/features/wallet/accounts/types'
import { getCaip10Id } from 'src/features/wallet/accounts/utils'
import { Address } from 'src/utils/Address'
import { logger } from 'src/utils/logger'

export class AccountManager {
  // Map of CAIP-10 ID to account (https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md)
  private readonly _accounts: Record<string, Account> = {}

  addAccount(newAccount: Account) {
    const id = getCaip10Id(newAccount.address, newAccount.chainId)
    if (this._accounts[id]) {
      throw new Error(`Attempting to overwrite existing account for ${newAccount}`)
    }
    this._accounts[id] = newAccount
  }

  removeAccount(address: Address, chainId: SupportedChainId) {
    const id = getCaip10Id(address, chainId)
    if (!this._accounts[id]) {
      logger.warn('Attempting to remove non-existing account', address)
      return
    }
    delete this._accounts[chainId]
  }

  getAccount(address: Address, chainId: SupportedChainId) {
    const id = getCaip10Id(address, chainId)
    if (!this._accounts[id]) {
      logger.warn('Attempting to get missing account', address)
      return null
    }
    return this._accounts[id]
  }

  listAccounts() {
    return Object.values(this._accounts).map((a) => ({
      type: a.type,
      address: a.address,
      chainId: a.chainId,
    }))
  }
}
