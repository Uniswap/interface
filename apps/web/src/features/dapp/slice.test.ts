import { createStore, Store } from '@reduxjs/toolkit'
import { ChainId } from 'wallet/src/constants/chains'
import {
  dappReducer,
  DappState,
  initialDappState,
  saveDappChain,
} from './slice'

describe('dappSlice', () => {
  let store: Store<DappState>

  beforeEach(() => {
    store = createStore(dappReducer, initialDappState)
  })

  it('should save dapp chain correctly', () => {
    const dappUrl = 'https://opensea.io'
    const walletAddress = '0x123'
    const chainId = ChainId.Mainnet

    store.dispatch(saveDappChain({ dappUrl, walletAddress, chainId }))

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

    store.dispatch(saveDappChain({ dappUrl, walletAddress, chainId: chainId1 }))
    store.dispatch(saveDappChain({ dappUrl, walletAddress, chainId: chainId2 }))

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
