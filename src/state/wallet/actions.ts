import { createAction } from '@reduxjs/toolkit'

export interface TokenBalanceListenerKey {
  address: string
  tokenAddress: string
}

// used by components that care about balances of given tokens and accounts
// being kept up to date
export const startListeningForTokenBalances = createAction<TokenBalanceListenerKey[]>('startListeningForTokenBalances')
export const stopListeningForTokenBalances = createAction<TokenBalanceListenerKey[]>('stopListeningForTokenBalances')
export const startListeningForBalance = createAction<{ addresses: string[] }>('startListeningForBalance')
export const stopListeningForBalance = createAction<{ addresses: string[] }>('stopListeningForBalance')

// these are used by the updater to update balances, and can also be used
// for optimistic updates, e.g. when a transaction is confirmed that changes the
// user's balances or allowances
export const updateTokenBalances = createAction<{
  chainId: number
  blockNumber: number
  address: string
  tokenBalances: {
    [address: string]: string
  }
}>('updateTokenBalances')

export const updateEtherBalances = createAction<{
  chainId: number
  blockNumber: number
  etherBalances: {
    [address: string]: string
  }
}>('updateEtherBalances')
