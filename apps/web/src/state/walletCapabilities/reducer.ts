import { createSlice } from '@reduxjs/toolkit'

export interface WalletCapabilitiesState {
  isAtomicBatchingSupported: boolean
}

const initialState: WalletCapabilitiesState = {
  isAtomicBatchingSupported: false,
}

const walletCapabilitiesSlice = createSlice({
  name: 'walletCapabilities',
  initialState,
  reducers: {
    setIsAtomicBatchingSupported(state, { payload }: { payload: boolean }) {
      state.isAtomicBatchingSupported = payload
    },
  },
})

export const { setIsAtomicBatchingSupported } = walletCapabilitiesSlice.actions
export default walletCapabilitiesSlice.reducer
