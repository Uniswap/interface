import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SupportedChainId } from 'src/constants/chains'
import { Balance } from 'src/features/balances/types'
import { AccountStub } from 'src/features/wallet/accounts/types'

interface Balances {
  byChainId: {
    [chainId in SupportedChainId]?: {
      [tokenAddress: string]: {
        [accountAddress: string]: Balance
      }
    }
  }
}

const initialState: Balances = {
  byChainId: {},
}

const slice = createSlice({
  name: 'balances',
  initialState,
  reducers: {
    updateBalances: (
      state,
      action: PayloadAction<{
        account: AccountStub
        updatedBalances: { [tokenAddress: string]: Balance }
      }>
    ) => {
      const { account, updatedBalances } = action.payload
      const { address: accountAddress, chainId } = account

      Object.keys(updatedBalances).forEach((tokenAddress) => {
        state.byChainId[chainId] ??= {}
        state.byChainId[chainId]![tokenAddress][accountAddress] = updatedBalances[tokenAddress]
      })
    },
    updateBalance: (
      state,
      action: PayloadAction<{
        account: AccountStub
        tokenAddress: string
        balance: Balance
      }>
    ) => {
      const { account, tokenAddress, balance } = action.payload
      const { address: accountAddress, chainId } = account
      state.byChainId[chainId] ??= {}
      state.byChainId[chainId]![tokenAddress] ??= {}
      state.byChainId[chainId]![tokenAddress][accountAddress] = balance
    },
    resetBalances: () => initialState,
  },
})

export const { updateBalances, updateBalance, resetBalances } = slice.actions

export const balancesSlice = slice.reducer
