import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'wallet/src/constants/chains'

export const DEFAULT_DAPP_URL = 'DEFAULT_DAPP_URL'
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
    saveDappChain(
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
  },
})

export const { saveDappChain } = slice.actions

export const dappReducer = slice.reducer
