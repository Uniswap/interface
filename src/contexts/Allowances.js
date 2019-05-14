import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'

import { safeAccess, isAddress, getTokenAllowance } from '../utils'
import { useBlockNumber } from './Application'

const UPDATE = 'UPDATE'

const AllowancesContext = createContext()

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

  const contextValue = useMemo(() => [state, { update }], [state, update])

  return <AllowancesContext.Provider value={contextValue}>{children}</AllowancesContext.Provider>
}

export function useAddressAllowance(address, tokenAddress, spenderAddress) {
  const { networkId, library } = useWeb3Context()

  const globalBlockNumber = useBlockNumber()

  const [state, { update }] = useAllowancesContext()
  const { value, blockNumber } = safeAccess(state, [networkId, address, tokenAddress, spenderAddress]) || {}

  useEffect(() => {
    if (
      isAddress(address) &&
      isAddress(tokenAddress) &&
      isAddress(spenderAddress) &&
      (value === undefined || blockNumber !== globalBlockNumber) &&
      (networkId || networkId === 0) &&
      library
    ) {
      let stale = false

      getTokenAllowance(address, tokenAddress, spenderAddress, library)
        .then(value => {
          if (!stale) {
            update(networkId, address, tokenAddress, spenderAddress, value, globalBlockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            update(networkId, address, tokenAddress, spenderAddress, null, globalBlockNumber)
          }
        })

      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, spenderAddress, value, blockNumber, globalBlockNumber, networkId, library, update])

  return value
}
