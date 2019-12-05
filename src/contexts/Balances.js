import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { useWeb3React } from '../hooks'
import { safeAccess, isAddress, getEtherBalance, getTokenBalance } from '../utils'
import { useBlockNumber } from './Application'
import { useTokenDetails, useAllTokenDetails } from './Tokens'
import { stat } from 'fs'

const UPDATE = 'UPDATE'

const BalancesContext = createContext()

function useBalancesContext() {
  return useContext(BalancesContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, address, tokenAddress, value, blockNumber } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [address]: {
            ...(safeAccess(state, [networkId, address]) || {}),
            [tokenAddress]: {
              value,
              blockNumber
            }
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in BalancesContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const update = useCallback((networkId, address, tokenAddress, value, blockNumber) => {
    dispatch({ type: UPDATE, payload: { networkId, address, tokenAddress, value, blockNumber } })
  }, [])

  return (
    <BalancesContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </BalancesContext.Provider>
  )
}

export function Updater() {
  /**
   * - get all tokens
   * - for each one, if balance is null, get it
   * - one gotten balance, updat state
   * - stagger them in 1-4s random intervals
   */

  const { library, chainId, account } = useWeb3React()

  const allTokens = useAllTokenDetails()

  const [state, { update }] = useBalancesContext()

  useEffect(() => {
    console.log('running')
    Object.keys(allTokens).map(tokenAddress => {
      const { value, blockNumber } = safeAccess(state, [chainId, account, tokenAddress]) || {}
      if (!value) {
        if (
          isAddress(account) &&
          (tokenAddress === 'ETH' || isAddress(tokenAddress)) &&
          (chainId || chainId === 0) &&
          library
        ) {
          let stale = false
          ;(tokenAddress === 'ETH'
            ? getEtherBalance(account, library)
            : getTokenBalance(tokenAddress, account, library)
          )
            .then(value => {
              if (!stale) {
                update(chainId, account, tokenAddress, value, blockNumber)
              }
            })
            .catch(() => {
              if (!stale) {
                update(chainId, account, tokenAddress, null, blockNumber)
              }
            })
          return () => {
            stale = true
          }
        }
      }
    })
  }, [account])

  return null
}

export function useAddressBalance(address, tokenAddress) {
  const { library, chainId } = useWeb3React()

  const globalBlockNumber = useBlockNumber()

  const [state, { update }] = useBalancesContext()
  const { value, blockNumber } = safeAccess(state, [chainId, address, tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(address) &&
      (tokenAddress === 'ETH' || isAddress(tokenAddress)) &&
      (value === undefined || blockNumber !== globalBlockNumber) &&
      (chainId || chainId === 0) &&
      library
    ) {
      let stale = false
      ;(tokenAddress === 'ETH' ? getEtherBalance(address, library) : getTokenBalance(tokenAddress, address, library))
        .then(value => {
          if (!stale) {
            update(chainId, address, tokenAddress, value, globalBlockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            update(chainId, address, tokenAddress, null, globalBlockNumber)
          }
        })
      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, value, blockNumber, globalBlockNumber, chainId, library, update])

  return value
}

export function useExchangeReserves(tokenAddress) {
  const { exchangeAddress } = useTokenDetails(tokenAddress)

  const reserveETH = useAddressBalance(exchangeAddress, 'ETH')
  const reserveToken = useAddressBalance(exchangeAddress, tokenAddress)

  return { reserveETH, reserveToken }
}
