import EventEmitter from 'eventemitter3'
import { getOrderedConnectedAddresses, isConnectedAccount } from 'src/app/features/dapp/utils'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { Account } from 'wallet/src/features/wallet/accounts/types'

const STATE_STORAGE_KEY = 'dappState'

export interface DappInfo {
  lastChainId: WalletChainId
  connectedAccounts: Account[]
  activeConnectedAddress: Address
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

function updateDappLatestChainId(dappUrl: string, chainId: WalletChainId): void {
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

function saveDappActiveAccount(dappUrl: string, account: Account): void {
  // Never directly mutate state, as some of its fields could have `writable: false`
  state = {
    ...state,
    [dappUrl]: {
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
  state = ((): DappState => {
    const dappUrlState = state[dappUrl]

    if (!dappUrlState) {
      return state
    }

    const updatedAccounts = account
      ? dappUrlState.connectedAccounts?.filter((existingAccount) => existingAccount.address !== account.address)
      : []

    const activeConnected = updatedAccounts[0]
    if (activeConnected) {
      return {
        ...state,
        [dappUrl]: {
          ...dappUrlState,
          connectedAccounts: updatedAccounts,
          activeConnectedAddress: activeConnected.address,
        },
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [dappUrl]: _, ...restState } = state
      return restState
    }
  })()
  queueDappStateSync()
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
  removeDappConnection,
  saveDappActiveAccount,
  addListener: dappStoreEventEmitter.addListener.bind(dappStoreEventEmitter),
  removeListener: dappStoreEventEmitter.removeListener.bind(dappStoreEventEmitter),
  updateDappConnectedAddress,
  updateDappLatestChainId,
}
