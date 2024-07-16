import { bubbleToTop } from 'utilities/src/primitives/array'
import { Account } from 'wallet/src/features/wallet/accounts/types'

export function isConnectedAccount(connectedAccounts: Account[], address: Address): boolean {
  return connectedAccounts.some((account) => account.address === address)
}

/** Gets the Account for a specific address. The address param must be in the list of connectedAccounts. */
export function getActiveConnectedAccount(connectedAccounts: Account[], activeConnectedAddress: Address): Account {
  const activeConnectedAccount = connectedAccounts.find((account) => account.address === activeConnectedAddress)
  if (!activeConnectedAccount) {
    throw new Error('The activeConnectedAddress must be in the list of connectedAccounts.')
  }
  return activeConnectedAccount
}

/** Returns all connected addresses with the currently connected address listed first. */
export function getOrderedConnectedAddresses(connectedAccounts: Account[], activeConnectedAddress: Address): Address[] {
  const connectedAddresses = connectedAccounts.map((account) => account.address)
  return bubbleToTop(connectedAddresses, (address) => address === activeConnectedAddress)
}
