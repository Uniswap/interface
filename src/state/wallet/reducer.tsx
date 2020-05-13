import { createReducer } from '@reduxjs/toolkit'
import { isAddress } from '../../utils'
import {
  startListeningForBalance,
  startListeningForTokenBalances,
  stopListeningForBalance,
  stopListeningForTokenBalances,
  updateEtherBalances,
  updateTokenBalances
} from './actions'

interface WalletState {
  readonly tokenBalanceListeners: {
    readonly [address: string]: {
      // the number of listeners for each address/token combo
      readonly [tokenAddress: string]: number
    }
  }

  readonly balanceListeners: {
    // the number of ether balance listeners for each address
    readonly [address: string]: number
  }

  readonly balances: {
    readonly [balanceKey: string]: {
      readonly value: string
      readonly blockNumber: number | undefined
    }
  }
}

export function balanceKey({
  chainId,
  address,
  tokenAddress
}: {
  chainId: number
  address: string
  tokenAddress?: string // undefined for ETH
}): string {
  return `${chainId}-${address}-${tokenAddress ?? 'ETH'}`
}

const initialState: WalletState = {
  balanceListeners: {},
  tokenBalanceListeners: {},
  balances: {}
}

export default createReducer(initialState, builder =>
  builder
    .addCase(startListeningForTokenBalances, (state, { payload: combos }) => {
      combos.forEach(combo => {
        if (!isAddress(combo.tokenAddress) || !isAddress(combo.address)) {
          console.error('invalid combo', combo)
          return
        }
        state.tokenBalanceListeners[combo.address] = state.tokenBalanceListeners[combo.address] ?? {}
        state.tokenBalanceListeners[combo.address][combo.tokenAddress] =
          (state.tokenBalanceListeners[combo.address][combo.tokenAddress] ?? 0) + 1
      })
    })
    .addCase(stopListeningForTokenBalances, (state, { payload: combos }) => {
      combos.forEach(combo => {
        if (!isAddress(combo.tokenAddress) || !isAddress(combo.address)) {
          console.error('invalid combo', combo)
          return
        }
        if (!state.tokenBalanceListeners[combo.address]) return
        if (!state.tokenBalanceListeners[combo.address][combo.tokenAddress]) return
        if (state.tokenBalanceListeners[combo.address][combo.tokenAddress] === 1) {
          delete state.tokenBalanceListeners[combo.address][combo.tokenAddress]
        } else {
          state.tokenBalanceListeners[combo.address][combo.tokenAddress]--
        }
      })
    })
    .addCase(startListeningForBalance, (state, { payload: { addresses } }) => {
      addresses.forEach(address => {
        if (!isAddress(address)) {
          console.error('invalid address', address)
          return
        }
        state.balanceListeners[address] = (state.balanceListeners[address] ?? 0) + 1
      })
    })
    .addCase(stopListeningForBalance, (state, { payload: { addresses } }) => {
      addresses.forEach(address => {
        if (!isAddress(address)) {
          console.error('invalid address', address)
          return
        }
        if (!state.balanceListeners[address]) return
        if (state.balanceListeners[address] === 1) {
          delete state.balanceListeners[address]
        } else {
          state.balanceListeners[address]--
        }
      })
    })
    .addCase(updateTokenBalances, (state, { payload: { chainId, address, blockNumber, tokenBalances } }) => {
      Object.keys(tokenBalances).forEach(tokenAddress => {
        const balance = tokenBalances[tokenAddress]
        const key = balanceKey({ chainId, address, tokenAddress })
        const data = state.balances[key]
        if (!data || data.blockNumber === undefined || data.blockNumber <= blockNumber) {
          state.balances[key] = { value: balance, blockNumber }
        }
      })
    })
    .addCase(updateEtherBalances, (state, { payload: { etherBalances, chainId, blockNumber } }) => {
      Object.keys(etherBalances).forEach(address => {
        const balance = etherBalances[address]
        const key = balanceKey({ chainId, address })
        const data = state.balances[key]
        if (!data || data.blockNumber === undefined || data.blockNumber <= blockNumber) {
          state.balances[key] = { value: balance, blockNumber }
        }
      })
    })
)
