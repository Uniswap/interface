import { createSlice } from '@reduxjs/toolkit'
import { Wallet } from 'connectors'

export interface WalletState {
  // We want the user to be able to define which wallet they want to use, even if there are multiple connected wallets via web3-react.
  // If a user had previously connected a wallet but didn't have a wallet override set (because they connected prior to this field being added),
  // we want to handle that case by backfilling them manually. Once we backfill, we set the backfilled field to `true`.
  // After some period of time, our active users will have this property set so we can likely remove the backfilling logic.
  walletOverrideBackfilled: boolean
  walletOverride?: Wallet

  errorByWallet: Record<Wallet, string | undefined>
}

export const initialState: WalletState = {
  walletOverride: undefined,
  walletOverrideBackfilled: false,

  errorByWallet: {
    [Wallet.INJECTED]: undefined,
    [Wallet.FORTMATIC]: undefined,
    [Wallet.WALLET_CONNECT]: undefined,
    [Wallet.COINBASE_WALLET]: undefined,
    [Wallet.NETWORK]: undefined,
    [Wallet.GNOSIS_SAFE]: undefined,
  },
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    updateWalletOverride(state, { payload: { wallet } }) {
      state.walletOverride = wallet
      state.walletOverrideBackfilled = true
    },
    updateWalletError(state, { payload: { wallet, error } }) {
      state.errorByWallet = { ...state.errorByWallet, [wallet]: error }
    },
  },
})

export const { updateWalletOverride, updateWalletError } = walletSlice.actions
export default walletSlice.reducer
