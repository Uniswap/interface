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

// all address keys are checksummed and valid addresses starting with 0x
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
        const [checksummedTokenAddress, checksummedAddress] = [isAddress(combo.tokenAddress), isAddress(combo.address)]
        if (!checksummedAddress || !checksummedTokenAddress) {
          console.error('invalid combo', combo)
          return
        }
        state.tokenBalanceListeners[checksummedAddress] = state.tokenBalanceListeners[checksummedAddress] ?? {}
        state.tokenBalanceListeners[checksummedAddress][checksummedTokenAddress] =
          (state.tokenBalanceListeners[checksummedAddress][checksummedTokenAddress] ?? 0) + 1
      })
    })
    .addCase(stopListeningForTokenBalances, (state, { payload: combos }) => {
      combos.forEach(combo => {
        const [checksummedTokenAddress, checksummedAddress] = [isAddress(combo.tokenAddress), isAddress(combo.address)]
        if (!checksummedAddress || !checksummedTokenAddress) {
          console.error('invalid combo', combo)
          return
        }
        if (!state.tokenBalanceListeners[checksummedAddress]) return
        if (!state.tokenBalanceListeners[checksummedAddress][checksummedTokenAddress]) return
        if (state.tokenBalanceListeners[checksummedAddress][checksummedTokenAddress] === 1) {
          delete state.tokenBalanceListeners[checksummedAddress][checksummedTokenAddress]
        } else {
          state.tokenBalanceListeners[checksummedAddress][checksummedTokenAddress]--
        }
      })
    })
    .addCase(startListeningForBalance, (state, { payload: { addresses } }) => {
      addresses.forEach(address => {
        const checksummedAddress = isAddress(address)
        if (!checksummedAddress) {
          console.error('invalid address', address)
          return
        }
        state.balanceListeners[checksummedAddress] = (state.balanceListeners[checksummedAddress] ?? 0) + 1
      })
    })
    .addCase(stopListeningForBalance, (state, { payload: { addresses } }) => {
      addresses.forEach(address => {
        const checksummedAddress = isAddress(address)
        if (!checksummedAddress) {
          console.error('invalid address', address)
          return
        }
        if (!state.balanceListeners[checksummedAddress]) return
        if (state.balanceListeners[checksummedAddress] === 1) {
          delete state.balanceListeners[checksummedAddress]
        } else {
          state.balanceListeners[checksummedAddress]--
        }
      })
    })
    .addCase(updateTokenBalances, (state, { payload: { chainId, address, blockNumber, tokenBalances } }) => {
      const checksummedAddress = isAddress(address)
      if (!checksummedAddress) return
      Object.keys(tokenBalances).forEach(tokenAddress => {
        const checksummedTokenAddress = isAddress(tokenAddress)
        if (!checksummedTokenAddress) return
        const balance = tokenBalances[checksummedTokenAddress]
        const key = balanceKey({ chainId, address: checksummedAddress, tokenAddress: checksummedTokenAddress })
        const data = state.balances[key]
        if (!data || data.blockNumber === undefined || data.blockNumber <= blockNumber) {
          state.balances[key] = { value: balance, blockNumber }
        }
      })
    })
    .addCase(updateEtherBalances, (state, { payload: { etherBalances, chainId, blockNumber } }) => {
      Object.keys(etherBalances).forEach(address => {
        const checksummedAddress = isAddress(address)
        if (!checksummedAddress) return

        const balance = etherBalances[checksummedAddress]
        const key = balanceKey({ chainId, address: checksummedAddress })
        const data = state.balances[key]
        if (!data || data.blockNumber === undefined || data.blockNumber <= blockNumber) {
          state.balances[key] = { value: balance, blockNumber }
        }
      })
    })
)
