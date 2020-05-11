import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'

import { useWeb3React } from '../hooks'
import { useBlockNumber, usePopups } from '../state/application/hooks'

const ADD = 'ADD'
const CHECK = 'CHECK'
const FINALIZE = 'FINALIZE'

interface TransactionState {
  [chainId: number]: {
    [txHash: string]: {
      blockNumberChecked: any
      response: {
        customData?: any
        summary: any
      }
      receipt: any
    }
  }
}

const TransactionsContext = createContext<[TransactionState, { [updater: string]: (...args: any[]) => void }]>([{}, {}])

export function useTransactionsContext() {
  return useContext(TransactionsContext)
}

function reducer(state: TransactionState, { type, payload }): TransactionState {
  switch (type) {
    case ADD: {
      const { networkId, hash, response } = payload

      if (state[networkId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }

      return {
        ...state,
        [networkId]: {
          ...state[networkId],
          [hash]: {
            response
          }
        }
      }
    }
    case CHECK: {
      const { networkId, hash, blockNumber } = payload

      if (!state[networkId]?.[hash]) {
        throw Error('Attempted to check non-existent transaction.')
      }

      return {
        ...state,
        [networkId]: {
          ...state[networkId],
          [hash]: {
            ...state[networkId]?.[hash],
            blockNumberChecked: blockNumber
          }
        }
      }
    }
    case FINALIZE: {
      const { networkId, hash, receipt } = payload

      if (!state[networkId]?.[hash]) {
        throw Error('Attempted to finalize non-existent transaction.')
      }

      return {
        ...state,
        [networkId]: {
          ...state[networkId],
          [hash]: {
            ...state[networkId]?.[hash],
            receipt
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in TransactionsContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }: { children: React.ReactNode }) {
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

  return (
    <TransactionsContext.Provider
      value={useMemo(() => [state, { add, check, finalize }], [state, add, check, finalize])}
    >
      {children}
    </TransactionsContext.Provider>
  )
}

export function Updater() {
  const { chainId, library } = useWeb3React()

  const globalBlockNumber = useBlockNumber()

  const [state, { check, finalize }] = useTransactionsContext()
  const allTransactions = state[chainId] ?? {}

  // show popup on confirm
  const [, addPopup] = usePopups()

  useEffect(() => {
    if ((chainId || chainId === 0) && library) {
      let stale = false
      Object.keys(allTransactions)
        .filter(
          hash => !allTransactions[hash].receipt && allTransactions[hash].blockNumberChecked !== globalBlockNumber
        )
        .forEach(hash => {
          library
            .getTransactionReceipt(hash)
            .then(receipt => {
              if (!stale) {
                if (!receipt) {
                  check(chainId, hash, globalBlockNumber)
                } else {
                  finalize(chainId, hash, receipt)
                  // add success or failure popup
                  if (receipt.status === 1) {
                    addPopup({
                      txn: {
                        hash,
                        success: true,
                        summary: allTransactions[hash]?.response?.summary
                      }
                    })
                  } else {
                    addPopup({
                      txn: { hash, success: false, summary: allTransactions[hash]?.response?.summary }
                    })
                  }
                }
              }
            })
            .catch(() => {
              check(chainId, hash, globalBlockNumber)
            })
        })

      return () => {
        stale = true
      }
    }
  }, [chainId, library, allTransactions, globalBlockNumber, check, finalize, addPopup])

  return null
}

export function useTransactionAdder() {
  const { chainId } = useWeb3React()

  const [, { add }] = useTransactionsContext()

  return useCallback(
    (response, summary = '', customData = {}) => {
      if (!(chainId || chainId === 0)) {
        throw Error(`Invalid networkId '${chainId}`)
      }
      const hash = response?.hash
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      add(chainId, hash, { ...response, customData: customData, summary })
    },
    [chainId, add]
  )
}

export function useAllTransactions() {
  const { chainId } = useWeb3React()

  const [state] = useTransactionsContext()

  return state[chainId] || {}
}

export function usePendingApproval(tokenAddress) {
  const allTransactions = useAllTransactions()
  return (
    Object.keys(allTransactions).filter(hash => {
      if (allTransactions[hash]?.receipt) {
        return false
      } else if (!allTransactions[hash]?.response) {
        return false
      } else if (allTransactions[hash]?.response?.customData?.approval !== tokenAddress) {
        return false
      } else {
        return true
      }
    }).length >= 1
  )
}
