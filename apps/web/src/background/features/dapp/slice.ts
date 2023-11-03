import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'wallet/src/constants/chains'

export interface DappState {
  [dappUrl: string]: {
    lastChainId: ChainId
    connectedAddresses: Address[]
    activeConnectedAddress: Address
  }
}

export const initialDappState: DappState = {}

const slice = createSlice({
  name: 'dapp',
  initialState: initialDappState,
  reducers: {
    // TODO(EXT-361): this needs to handle updating for other connected dapps at the same time
    // even if they are not the active dapp.
    updateDappConnectedAddress(
      state,
      action: PayloadAction<{ dappUrl: string; address: Address }>
    ) {
      const { dappUrl, address } = action.payload
      const dappUrlState = state[dappUrl]

      if (!dappUrlState?.connectedAddresses.includes(address)) {
        return
      }

      dappUrlState.activeConnectedAddress = address
    },
    saveDappChain(state, action: PayloadAction<{ dappUrl: string; chainId: ChainId }>) {
      const { dappUrl, chainId } = action.payload
      const dappUrlState = state[dappUrl]

      if (!dappUrlState) {
        return
      }

      dappUrlState.lastChainId = chainId
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
      if (isConnectionNew) {
        currConnectedAddresses.push(walletAddress)
      }

      state[dappUrl] = {
        lastChainId: state[dappUrl]?.lastChainId ?? ChainId.Mainnet,
        activeConnectedAddress: walletAddress,
        connectedAddresses: currConnectedAddresses,
      }
    },
    removeDappConnection(
      state,
      action: PayloadAction<{ dappUrl: string; walletAddress: Address }>
    ) {
      const { dappUrl, walletAddress } = action.payload
      const dappUrlState = state[dappUrl]

      const updatedAddresses = dappUrlState?.connectedAddresses?.filter(
        (address) => address !== walletAddress
      )

      if (dappUrlState && updatedAddresses?.length) {
        dappUrlState.connectedAddresses = updatedAddresses
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        dappUrlState.activeConnectedAddress = updatedAddresses[0]!
      } else {
        delete state[dappUrl]
      }
    },
  },
})

export const {
  saveDappConnection,
  removeDappConnection,
  saveDappChain,
  updateDappConnectedAddress,
} = slice.actions

export const dappReducer = slice.reducer
