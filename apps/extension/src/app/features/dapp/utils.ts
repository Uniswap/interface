import { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'
import { bubbleToTop } from 'utilities/src/primitives/array'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { promiseTimeout } from 'utilities/src/time/timing'
import { Account } from 'wallet/src/features/wallet/accounts/types'

const MAX_TAB_QUERY_TIME = ONE_SECOND_MS

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

/**
 * Get the capitalized display name of a dapp from the tab title; the uncapitalized name is extracted from the dapp URL
 * @param dappUrl - extracted url for dapp
 * @returns a promise that resolves to the display name of the dapp, or an empty string if not found
 */
export async function getCapitalizedDisplayNameFromTab(dappUrl: string): Promise<string | undefined> {
  const getActiveTab = chrome.tabs.query({ active: true, currentWindow: true })
  const [activeTab] = (await promiseTimeout(getActiveTab, MAX_TAB_QUERY_TIME)) || []

  if (!activeTab?.title) {
    return undefined
  }

  const dappNameFromUrl = extractNameFromUrl(dappUrl)
  const nameIndex = activeTab.title.toLowerCase().indexOf(dappNameFromUrl)

  if (nameIndex === -1) {
    return undefined
  }

  const capitalizedDisplayName = activeTab.title.substring(nameIndex, nameIndex + dappNameFromUrl.length)
  return capitalizedDisplayName
}
