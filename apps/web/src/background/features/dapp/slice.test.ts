// TODO(EXT-317): Once our testing setup is fixed properly this shouldn't have to be mocked.
jest.mock('wallet/src/constants/chains', () => ({
  ChainId: {
    Mainnet: 1,
    ArbitrumOne: 42161,
    Base: 8453,
    Optimism: 10,
    Polygon: 137,
    PolygonMumbai: 80001,
    Bnb: 56,
  },
}))

import { createStore, Store } from '@reduxjs/toolkit'
import { ChainId } from 'wallet/src/constants/chains'

import {
  dappReducer,
  DappState,
  initialDappState,
  removeDappConnection,
  saveDappChain,
  saveDappConnection,
} from './slice'

const OPENSEA_URL = 'https://opensea.io'
const UNISWAP_URL = 'https://app.uniswap.org'
const WALLET_ADDRESS_1 = '0x123'
const WALLET_ADDRESS_2 = '0x456'
const WALLET_ADDRESS_3 = '0x789'

describe('dappSlice', () => {
  let store: Store<DappState>

  beforeEach(() => {
    store = createStore(dappReducer, initialDappState)
  })

  it('should save dapp chain correctly', () => {
    store.dispatch(saveDappChain({ dappUrl: OPENSEA_URL, chainId: ChainId.Mainnet }))
    let expectedState: DappState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Mainnet,
        connectedAddresses: [],
      },
    }

    expect(store.getState()).toEqual(expectedState)

    store.dispatch(saveDappConnection({ dappUrl: OPENSEA_URL, walletAddress: WALLET_ADDRESS_1 }))
    store.dispatch(saveDappChain({ dappUrl: OPENSEA_URL, chainId: ChainId.Optimism }))
    expectedState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Optimism,
        connectedAddresses: [WALLET_ADDRESS_1],
      },
    }
    expect(store.getState()).toEqual(expectedState)

    store.dispatch(saveDappChain({ dappUrl: UNISWAP_URL, chainId: ChainId.Base }))
    expectedState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Optimism,
        connectedAddresses: [WALLET_ADDRESS_1],
      },
      [UNISWAP_URL]: {
        lastChainId: ChainId.Base,
        connectedAddresses: [],
      },
    }
    expect(store.getState()).toEqual(expectedState)
  })

  it('should save dapp connection correctly', () => {
    store.dispatch(saveDappConnection({ dappUrl: OPENSEA_URL, walletAddress: WALLET_ADDRESS_1 }))
    let expectedState: DappState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Mainnet,
        connectedAddresses: [WALLET_ADDRESS_1],
      },
    }
    expect(store.getState()).toEqual(expectedState)

    store.dispatch(saveDappConnection({ dappUrl: OPENSEA_URL, walletAddress: WALLET_ADDRESS_2 }))
    expectedState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Mainnet,
        connectedAddresses: [WALLET_ADDRESS_2, WALLET_ADDRESS_1],
      },
    }
    expect(store.getState()).toEqual(expectedState)

    store.dispatch(saveDappConnection({ dappUrl: OPENSEA_URL, walletAddress: WALLET_ADDRESS_3 }))
    expectedState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Mainnet,
        connectedAddresses: [WALLET_ADDRESS_3, WALLET_ADDRESS_2, WALLET_ADDRESS_1],
      },
    }
    expect(store.getState()).toEqual(expectedState)

    store.dispatch(
      saveDappConnection({
        dappUrl: UNISWAP_URL,
        walletAddress: WALLET_ADDRESS_1,
        chainId: ChainId.Base,
      })
    )
    expectedState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Mainnet,
        connectedAddresses: [WALLET_ADDRESS_3, WALLET_ADDRESS_2, WALLET_ADDRESS_1],
      },
      [UNISWAP_URL]: {
        lastChainId: ChainId.Base,
        connectedAddresses: [WALLET_ADDRESS_1],
      },
    }
    expect(store.getState()).toEqual(expectedState)
  })

  it('should remove dapp connection correctly', () => {
    store.dispatch(saveDappConnection({ dappUrl: OPENSEA_URL, walletAddress: WALLET_ADDRESS_1 }))
    store.dispatch(saveDappConnection({ dappUrl: OPENSEA_URL, walletAddress: WALLET_ADDRESS_2 }))
    store.dispatch(saveDappConnection({ dappUrl: OPENSEA_URL, walletAddress: WALLET_ADDRESS_3 }))
    store.dispatch(
      saveDappConnection({
        dappUrl: UNISWAP_URL,
        walletAddress: WALLET_ADDRESS_1,
        chainId: ChainId.Base,
      })
    )

    store.dispatch(removeDappConnection({ dappUrl: OPENSEA_URL, walletAddress: WALLET_ADDRESS_2 }))
    let expectedState: DappState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Mainnet,
        connectedAddresses: [WALLET_ADDRESS_3, WALLET_ADDRESS_1],
      },
      [UNISWAP_URL]: {
        lastChainId: ChainId.Base,
        connectedAddresses: [WALLET_ADDRESS_1],
      },
    }
    expect(store.getState()).toEqual(expectedState)

    store.dispatch(removeDappConnection({ dappUrl: UNISWAP_URL, walletAddress: WALLET_ADDRESS_1 }))
    expectedState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Mainnet,
        connectedAddresses: [WALLET_ADDRESS_3, WALLET_ADDRESS_1],
      },
    }
    expect(store.getState()).toEqual(expectedState)

    store.dispatch(removeDappConnection({ dappUrl: OPENSEA_URL, walletAddress: WALLET_ADDRESS_3 }))
    expectedState = {
      [OPENSEA_URL]: {
        lastChainId: ChainId.Mainnet,
        connectedAddresses: [WALLET_ADDRESS_1],
      },
    }
    expect(store.getState()).toEqual(expectedState)
  })
})
