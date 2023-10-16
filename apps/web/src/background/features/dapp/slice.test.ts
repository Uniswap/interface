import { createStore, Store } from '@reduxjs/toolkit'

import { dappReducer, DappState, initialDappState, saveDappConnection } from './slice'

// Import breaks our jest tests because the use of `config` requires a package that is not available in the jest environment
// TODO: see https://linear.app/uniswap/issue/EXT-317/fix-jest-setup-on-web
enum ChainId {
  Mainnet = 1,
  Goerli = 5,

  ArbitrumOne = 42161,
  Base = 8453,
  Optimism = 10,
  Polygon = 137,
  PolygonMumbai = 80001,
  Bnb = 56,
}

describe('dappSlice', () => {
  let store: Store<DappState>

  beforeEach(() => {
    store = createStore(dappReducer, initialDappState)
  })

  it('should save dapp chain correctly', () => {
    const dappUrl = 'https://opensea.io'
    const walletAddress = '0x123'
    const chainId = ChainId.Mainnet

    store.dispatch(saveDappConnection({ dappUrl, walletAddress, chainId }))

    const expectedState: DappState = {
      [dappUrl]: {
        [walletAddress]: {
          lastChainId: chainId,
        },
      },
    }

    expect(store.getState()).toEqual(expectedState)
  })

  it('should update dapp chain correctly', () => {
    const dappUrl = 'https://opensea.io'
    const walletAddress = '0x123'
    const chainId1 = ChainId.Mainnet
    const chainId2 = ChainId.Optimism

    store.dispatch(saveDappConnection({ dappUrl, walletAddress, chainId: chainId1 }))
    store.dispatch(saveDappConnection({ dappUrl, walletAddress, chainId: chainId2 }))

    const expectedState: DappState = {
      [dappUrl]: {
        [walletAddress]: {
          lastChainId: chainId2,
        },
      },
    }

    expect(store.getState()).toEqual(expectedState)
  })
})
