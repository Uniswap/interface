import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'wallet/src/constants/chains'

export interface DappState {
  [dappUrl: string]: {
    lastChainId: ChainId
    connectedAddresses: Address[]
  }
}

export const initialDappState: DappState = {}

const slice = createSlice({
  name: 'dapp',
  initialState: initialDappState,
  reducers: {
    saveDappChain(state, action: PayloadAction<{ dappUrl: string; chainId: ChainId }>) {
      const { dappUrl, chainId } = action.payload

      state[dappUrl] = {
        lastChainId: chainId,
        connectedAddresses: state[dappUrl]?.connectedAddresses ?? [],
      }
    },
    saveDappConnection(
      state,
      action: PayloadAction<{
        dappUrl: string
        walletAddress: Address
      }>
    ) {
      const { dappUrl, walletAddress } = action.payload

      const currConnectedAddresses = state[dappUrl]?.connectedAddresses || []
      const isConnectionNew = !currConnectedAddresses?.includes(walletAddress)

      state[dappUrl] = {
        lastChainId: state[dappUrl]?.lastChainId ?? ChainId.Mainnet,
        connectedAddresses: isConnectionNew
          ? [walletAddress, ...currConnectedAddresses]
          : currConnectedAddresses,
      }
    },
    removeDappConnection(
      state,
      action: PayloadAction<{ dappUrl: string; walletAddress: Address }>
    ) {
      const { dappUrl, walletAddress } = action.payload

      const updatedAddresses = state[dappUrl]?.connectedAddresses?.filter(
        (address) => address !== walletAddress
      )

      if (updatedAddresses?.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        state[dappUrl]!.connectedAddresses = updatedAddresses
      } else {
        delete state[dappUrl]
      }
    },
  },
})

export const { saveDappConnection, removeDappConnection, saveDappChain } = slice.actions

export const dappReducer = slice.reducer
