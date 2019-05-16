import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'

import { safeAccess } from '../utils'
import { useBlockNumber } from './Application'

const RESPONSE = 'response'
const BLOCK_NUMBER_CHECKED = 'BLOCK_NUMBER_CHECKED'
const RECEIPT = 'receipt'

const ADD = 'ADD'
const CHECK = 'CHECK'
const FINALIZE = 'FINALIZE'

const TransactionsContext = createContext()

export function useTransactionsContext() {
  return useContext(TransactionsContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case ADD: {
      const { networkId, hash, response } = payload

      if (safeAccess(state, [networkId, hash]) !== null) {
        throw Error('Attempted to add existing transaction.')
      }

      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [hash]: {
            [RESPONSE]: response
          }
        }
      }
    }
    case CHECK: {
      const { networkId, hash, blockNumber } = payload

      if (safeAccess(state, [networkId, hash]) === null) {
        throw Error('Attempted to check non-existent transaction.')
      }

      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [hash]: {
            ...(safeAccess(state, [networkId, hash]) || {}),
            [BLOCK_NUMBER_CHECKED]: blockNumber
          }
        }
      }
    }
    case FINALIZE: {
      const { networkId, hash, receipt } = payload

      if (safeAccess(state, [networkId, hash]) === null) {
        throw Error('Attempted to finalize non-existent transaction.')
      }

      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [hash]: {
            ...(safeAccess(state, [networkId, hash]) || {}),
            [RECEIPT]: receipt
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in TransactionsContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})

  const add = useCallback((networkId, hash, response) => {
    dispatch({ type: ADD, payload: { networkId, hash, response } })
  }, [])
  const check = useCallback((networkId, hash, blockNumber) => {
    dispatch({ type: CHECK, payload: { networkId, hash, blockNumber } })
  }, [])
  const finalize = useCallback((networkId, hash, receipt) => {
    dispatch({ type: FINALIZE, payload: { networkId, hash, receipt } })
  }, [])

  const contextValue = useMemo(() => [state, { add, check, finalize }], [state, add, check, finalize])

  return <TransactionsContext.Provider value={contextValue}>{children}</TransactionsContext.Provider>
}

export function Updater() {
  const { networkId, library } = useWeb3Context()

  const globalBlockNumber = useBlockNumber()

  const [state, { check, finalize }] = useTransactionsContext()
  const allTransactions = safeAccess(state, [networkId]) || {}

  useEffect(() => {
    if ((networkId || networkId === 0) && library) {
      let stale = false
      Object.keys(allTransactions)
        .filter(
          hash => !allTransactions[hash][RECEIPT] && allTransactions[hash][BLOCK_NUMBER_CHECKED] !== globalBlockNumber
        )
        .forEach(hash => {
          library
            .getTransactionReceipt(hash)
            .then(receipt => {
              if (!stale) {
                if (!receipt) {
                  check(networkId, hash, globalBlockNumber)
                } else {
                  finalize(networkId, hash, receipt)
                }
              }
            })
            .catch(() => {
              check(networkId, hash, globalBlockNumber)
            })
        })

      return () => {
        stale = true
      }
    }
  }, [networkId, library, allTransactions, globalBlockNumber, check, finalize])

  return null
}

export function useTransactionAdder() {
  const { networkId } = useWeb3Context()

  const [, { add }] = useTransactionsContext()

  return useCallback(
    response => {
      if (!(networkId || networkId === 0)) {
        throw Error(`Invalid networkId '${networkId}`)
      }

      const hash = safeAccess(response, ['hash'])

      if (!hash) {
        throw Error('No transaction hash found.')
      }
      add(networkId, hash, response)
    },
    [networkId, add]
  )
}

export function useAllTransactions() {
  const { networkId } = useWeb3Context()

  const [state] = useTransactionsContext()

  return safeAccess(state, [networkId]) || {}
}

export function usePendingApproval(tokenAddress) {
  const allTransactions = useAllTransactions()

  return (
    Object.keys(allTransactions).filter(hash => {
      if (allTransactions[hash][RECEIPT]) {
        return false
      } else if (!allTransactions[hash][RESPONSE]) {
        return false
      } else if (allTransactions[hash][RESPONSE].to !== tokenAddress) {
        return false
      } else if (
        allTransactions[hash][RESPONSE].data.substring(0, 10) !==
        ethers.utils.id('approve(address,uint256)').substring(0, 10)
      ) {
        return false
      } else {
        return true
      }
    }).length >= 1
  )
}
