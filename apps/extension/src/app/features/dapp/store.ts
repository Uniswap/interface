import { cloneDeep } from '@apollo/client/utilities'
import EventEmitter from 'eventemitter3'
import { getOrderedConnectedAddresses, isConnectedAccount } from 'src/app/features/dapp/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'

const STATE_STORAGE_KEY = 'dappState'

export interface DappInfo {
  lastChainId: UniverseChainId
  connectedAccounts: Account[]
  activeConnectedAddress: Address
  iconUrl?: string
  displayName?: string
}

export interface DappState {
  [dappUrl: string]: DappInfo
}

const initialDappState: DappState = {}
let state: DappState

// Event Emitter
export enum DappStoreEvent {
  DappStateUpdated = 'DappStateUpdated',
}

class DappStoreEventEmitter extends EventEmitter<DappStoreEvent> {}
const dappStoreEventEmitter = new DappStoreEventEmitter()

// Init
let initPromise: Promise<void> | undefined

async function init(): Promise<void> {
  if (!initPromise) {
    initPromise = initInternal()
  }

  return initPromise
}

async function initInternal(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  state = (await chrome.storage.local.get([STATE_STORAGE_KEY]))?.[STATE_STORAGE_KEY] || initialDappState

  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes.dappState) {
      state = changes.dappState.newValue
      dappStoreEventEmitter.emit(DappStoreEvent.DappStateUpdated, state)
    }
  })
}

// Sequential syncing of state to local storage
let dappStateSyncPromise = Promise.resolve()
let dappStateChangesNeedSync = false
function queueDappStateSync(): void {
  if (!dappStateChangesNeedSync) {
    dappStateChangesNeedSync = true
    dappStateSyncPromise = dappStateSyncPromise.then((): Promise<void> => {
      dappStateChangesNeedSync = false
      return chrome.storage.local.set({ [STATE_STORAGE_KEY]: state })
    })
  }
}

/** Returns all dapp URLs that are connected to a particular address. */
function getConnectedDapps(address: Address): string[] {
  return Object.entries(state)
    .filter(([_, dappInfo]) => isConnectedAccount(dappInfo.connectedAccounts, address))
    .map(([dappUrl]) => dappUrl)
}

// TODO(WALL-4643): explore usage of immer here
/** Returns connected addresses with the currently connected address listed first. */
function getDappOrderedConnectedAddresses(dappUrl: string): string[] | undefined {
  const dappInfo = state[dappUrl]
  if (!dappInfo) {
    return undefined
  }
  const { connectedAccounts, activeConnectedAddress } = dappInfo
  return getOrderedConnectedAddresses(connectedAccounts, activeConnectedAddress)
}

function getDappInfo(dappUrl: string | undefined): DappInfo | undefined {
  return dappUrl ? state[dappUrl] : undefined
}

function getDappInfoIfConnected(dappUrl: string | undefined): DappInfo | undefined {
  const dappInfo = getDappInfo(dappUrl)
  return dappInfo && dappInfo.connectedAccounts.length > 0 ? dappInfo : undefined
}

function getDappUrls(): string[] {
  return Object.keys(state)
}

// Update the connected address for all dapps
function updateDappConnectedAddress(address: Address): void {
  // Never directly mutate state, as some of its fields could have `writable: false`
  state = Object.fromEntries(
    Object.entries(state).map(([key, dappUrlState]) => {
      if (isConnectedAccount(dappUrlState.connectedAccounts, address)) {
        return [key, { ...dappUrlState, activeConnectedAddress: address }]
      }
      return [key, dappUrlState]
    }),
  )
  queueDappStateSync()
}

/**
 * Helper function to update a specific property of a dapp in the state
 * @param dappUrl - extracted url for dapp
 * @param property - key of dapp property to update
 * @param value - new value for the property
 */
function updateDappProperty<T extends keyof DappInfo>({
  dappUrl,
  property,
  value,
}: {
  dappUrl: string
  property: T
  value?: DappInfo[T]
}): void {
  const info = state[dappUrl]

  if (!info) {
    return
  }

  state = {
    ...state,
    [dappUrl]: {
      ...info,
      [property]: value,
    },
  }

  queueDappStateSync()
}

/**
 * Update the display name for a dapp; the dapp must be in state already for this to work
 * (ie can't run immediately after a dapp is connected)
 * @param dappUrl - extracted url for dapp
 * @param newDisplayName - new display name for dapp
 */
function updateDappDisplayName(dappUrl: string, newDisplayName?: string): void {
  updateDappProperty({ dappUrl, property: 'displayName', value: newDisplayName })
}

/**
 * Update the icon URL for a dapp
 * @param dappUrl - extracted url for dapp
 * @param newIconUrl - new icon URL for dapp
 */
function updateDappIconUrl(dappUrl: string, newIconUrl?: string): void {
  updateDappProperty({ dappUrl, property: 'iconUrl', value: newIconUrl })
}

// TODO(WALL-4643): if we migrate to immer, let's avoid iterating over the the object here
function updateDappLatestChainId(dappUrl: string, chainId: UniverseChainId): void {
  // Never directly mutate state, as some of its fields could have `writable: false`
  state = Object.fromEntries(
    Object.entries(state).map(([key, dappUrlState]) => {
      if (key === dappUrl) {
        return [key, { ...dappUrlState, lastChainId: chainId }]
      }
      return [key, dappUrlState]
    }),
  )
  queueDappStateSync()
}

function saveDappActiveAccount({
  dappUrl,
  account,
  initialProperties,
}: {
  dappUrl: string
  account: Account
  initialProperties?: Partial<DappInfo>
}): void {
  // Never directly mutate state, as some of its fields could have `writable: false`
  state = {
    ...state,
    [dappUrl]: {
      ...state[dappUrl],
      // TODO: WALL-4919: Remove hardcoded Mainnet
      lastChainId: state[dappUrl]?.lastChainId ?? UniverseChainId.Mainnet,
      activeConnectedAddress: account.address,
      connectedAccounts: ((): Account[] => {
        const currConnectedAccounts = state[dappUrl]?.connectedAccounts || []
        const isConnectionNew = !isConnectedAccount(currConnectedAccounts, account.address)

        if (isConnectionNew) {
          return [...currConnectedAccounts, account]
        }
        return currConnectedAccounts
      })(),
      ...initialProperties,
    },
  }
  queueDappStateSync()
}

/**
 * Remove a dapp connection
 * @param dappUrl extracted url for dapp
 * @param account target account to remove connection. If undefined, will remove all accounts
 * @returns
 */
function removeDappConnection(dappUrl: string, account?: Account): void {
  // Never directly mutate state, as some of its fields could have `writable: false`
  state = removeDappConnectionHelper({ initialState: state, dappUrl, account })
  queueDappStateSync()
}

/**
 * Remove all dapp connections for a specific account
 * @param account - the account to remove all connections for
 */
function removeAccountDappConnections(account: Account): void {
  let updatedState = { ...state }

  for (const dappUrl of getDappUrls()) {
    updatedState = removeDappConnectionHelper({ initialState: updatedState, dappUrl, account })
  }

  state = updatedState
  queueDappStateSync()
}

/**
 * Helper function to remove a dapp connection
 * @param initialState - the initial mapping of dapp URLs to DappInfo
 * @param dappUrl - the URL of the dapp (key) to target
 * @param account - the account to remove from the target dapp; if undefined, all accounts will be removed
 * @returns the updated state
 */
function removeDappConnectionHelper({
  initialState,
  dappUrl,
  account,
}: {
  initialState: DappState
  dappUrl: string
  account?: Account
}): DappState {
  const newState = cloneDeep(initialState)
  const dappInfo = newState[dappUrl]

  if (!dappInfo) {
    return initialState
  }

  dappInfo.connectedAccounts = dappInfo.connectedAccounts.filter(
    (existingAccount) => existingAccount.address !== account?.address,
  )

  const nextConnectedAccount = dappInfo.connectedAccounts[0]

  if (!nextConnectedAccount || !account) {
    delete newState[dappUrl]
    return newState
  }

  if (dappInfo.activeConnectedAddress === account.address) {
    dappInfo.activeConnectedAddress = nextConnectedAccount.address
  }
  return newState
}

function removeAllDappConnections(): void {
  state = {}
  queueDappStateSync()
}

export const dappStore = {
  getConnectedDapps,
  getDappInfo,
  getDappInfoIfConnected,
  getDappOrderedConnectedAddresses,
  getDappUrls,
  init,
  removeAllDappConnections,
  removeAccountDappConnections,
  removeDappConnection,
  saveDappActiveAccount,
  addListener: dappStoreEventEmitter.addListener.bind(dappStoreEventEmitter),
  removeListener: dappStoreEventEmitter.removeListener.bind(dappStoreEventEmitter),
  updateDappConnectedAddress,
  updateDappLatestChainId,
  updateDappIconUrl,
  updateDappDisplayName,
}
