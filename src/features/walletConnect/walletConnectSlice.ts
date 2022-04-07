import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface WalletConnectSession {
  id: string
  dappName: string
}

interface SessionMapping {
  [sessionId: string]: WalletConnectSession
}

export interface WalletConnectState {
  byAccount: {
    [accountId: string]: {
      sessions: SessionMapping
    }
  }
}

const initialWalletConnectState: Readonly<WalletConnectState> = { byAccount: {} }

const slice = createSlice({
  name: 'walletconnect',
  initialState: initialWalletConnectState,
  reducers: {
    addSession: (
      state,
      action: PayloadAction<{ account: string; wcSession: WalletConnectSession }>
    ) => {
      const { wcSession, account } = action.payload
      state.byAccount[account] ??= { sessions: {} }
      state.byAccount[account].sessions[wcSession.id] = wcSession
    },

    removeSession: (state, action: PayloadAction<{ account: string; sessionId: string }>) => {
      const { sessionId, account } = action.payload
      if (state.byAccount[account]) {
        delete state.byAccount[account].sessions[sessionId]
      }
    },
  },
})

export const { addSession, removeSession } = slice.actions
export const { reducer: walletConnectReducer, actions: walletConnectActions } = slice
