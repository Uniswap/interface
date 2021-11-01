import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'src/constants/chains'
import { Balance } from 'src/features/balances/types'

interface Balances {
  byChainId: {
    [chainId in ChainId]?: {
      [tokenAddress: Address]: {
        [accountAddress: Address]: Balance
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
        address: Address
        chainId: ChainId
        updatedBalances: { [tokenAddress: Address]: Balance }
      }>
    ) => {
      const { address: accountAddress, chainId, updatedBalances } = action.payload
      Object.keys(updatedBalances).forEach((tokenAddress) => {
        state.byChainId[chainId] ??= {}
        state.byChainId[chainId]![tokenAddress] ??= {}
        state.byChainId[chainId]![tokenAddress][accountAddress] = updatedBalances[tokenAddress]
      })
    },
    updateBalance: (
      state,
      action: PayloadAction<{
        address: Address
        chainId: ChainId
        tokenAddress: Address
        balance: Balance
      }>
    ) => {
      const { address: accountAddress, chainId, tokenAddress, balance } = action.payload
      state.byChainId[chainId] ??= {}
      state.byChainId[chainId]![tokenAddress] ??= {}
      state.byChainId[chainId]![tokenAddress][accountAddress] = balance
    },
    resetBalances: () => initialState,
  },
})

export const { updateBalances, updateBalance, resetBalances } = slice.actions

export const balancesSlice = slice.reducer
