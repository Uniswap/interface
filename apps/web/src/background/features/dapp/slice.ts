import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'wallet/src/constants/chains'

export interface DappState {
  [dappUrl: string]: {
    [walletAddress: Address]: {
      lastChainId: ChainId
    }
  }
}

export const initialDappState: DappState = {}

const slice = createSlice({
  name: 'dapp',
  initialState: initialDappState,
  reducers: {
    saveDappConnection(
      state,
      action: PayloadAction<{
        dappUrl: string
        walletAddress: Address
        chainId: ChainId
      }>
    ) {
      const { dappUrl, walletAddress, chainId } = action.payload
      state[dappUrl] ??= {}

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state[dappUrl]![walletAddress] = {
        lastChainId: chainId,
      }
    },
    removeDappConnection(
      state,
      action: PayloadAction<{ dappUrl: string; walletAddress: Address }>
    ) {
      const { dappUrl, walletAddress } = action.payload

      if (state[dappUrl]?.[walletAddress]) {
        delete state[dappUrl]?.[walletAddress]
        if (!Object.keys(state[dappUrl] || {}).length) {
          delete state[dappUrl]
        }
      }
    },
  },
})

export const { saveDappConnection, removeDappConnection } = slice.actions

export const dappReducer = slice.reducer
