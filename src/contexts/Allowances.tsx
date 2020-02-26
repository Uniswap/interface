import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { Token, TokenAmount } from '@uniswap/sdk'

import { useWeb3React } from '../hooks'
import { safeAccess, isAddress, getTokenAllowance } from '../utils'
import { useBlockNumber } from './Application'

const UPDATE = 'UPDATE'

const AllowancesContext = createContext([])

function useAllowancesContext() {
  return useContext(AllowancesContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, address, tokenAddress, spenderAddress, value, blockNumber } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [address]: {
            ...(safeAccess(state, [networkId, address]) || {}),
            [tokenAddress]: {
              ...(safeAccess(state, [networkId, address, tokenAddress]) || {}),
              [spenderAddress]: {
                value,
                blockNumber
              }
            }
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in AllowancesContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((networkId, address, tokenAddress, spenderAddress, value, blockNumber) => {
    dispatch({ type: UPDATE, payload: { networkId, address, tokenAddress, spenderAddress, value, blockNumber } })
  }, [])

  return (
    <AllowancesContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </AllowancesContext.Provider>
  )
}

export function useAddressAllowance(address: string, token: Token, spenderAddress: string): TokenAmount {
  const { library, chainId } = useWeb3React()

  const globalBlockNumber = useBlockNumber()

  const [state, { update }] = useAllowancesContext()
  const { value, blockNumber } = safeAccess(state, [chainId, address, token.address, spenderAddress]) || {}

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(token.address) &&
      isAddress(spenderAddress) &&
      (value === undefined || blockNumber !== globalBlockNumber) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false

      getTokenAllowance(address, token.address, spenderAddress, library)
        .then(value => {
          if (!stale) {
            update(chainId, address, token.address, spenderAddress, value, globalBlockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            update(chainId, address, token.address, spenderAddress, null, globalBlockNumber)
          }
        })

      return () => {
        stale = true
      }
    }
  }, [address, token.address, spenderAddress, value, blockNumber, globalBlockNumber, chainId, library, update])

  const newTokenAmount: TokenAmount = value ? new TokenAmount(token, value) : null
  return newTokenAmount
}
