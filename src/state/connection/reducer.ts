import { createSlice } from '@reduxjs/toolkit'
import { ConnectionType } from 'connection/types'

interface ConnectionState {
  errorByConnectionType: Record<ConnectionType, string | undefined>
}

const initialState: ConnectionState = {
  errorByConnectionType: {
    [ConnectionType.UNISWAP_WALLET]: undefined,
    [ConnectionType.INJECTED]: undefined,
    [ConnectionType.WALLET_CONNECT]: undefined,
    [ConnectionType.WALLET_CONNECT_V2]: undefined,
    [ConnectionType.COINBASE_WALLET]: undefined,
    [ConnectionType.NETWORK]: undefined,
    [ConnectionType.GNOSIS_SAFE]: undefined,
  },
}

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    updateConnectionError(
      state,
      { payload: { connectionType, error } }: { payload: { connectionType: ConnectionType; error?: string } }
    ) {
      state.errorByConnectionType[connectionType] = error
    },
  },
})

export const { updateConnectionError } = connectionSlice.actions
export default connectionSlice.reducer
