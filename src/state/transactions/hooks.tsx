import { TransactionResponse } from '@ethersproject/providers'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useWeb3React } from '../../hooks'
import { useAddPopup, useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { addTransaction, checkTransaction, CustomData, finalizeTransaction } from './actions'
import { TransactionData } from './reducer'

export function Updater() {
  const { chainId, library } = useWeb3React()

  const globalBlockNumber = useBlockNumber()

  const dispatch = useDispatch<AppDispatch>()
  const transactions = useSelector<AppState>(state => state.transactions)

  const allTransactions = transactions[chainId] ?? {}

  // show popup on confirm
  const addPopup = useAddPopup()

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
                  dispatch(checkTransaction({ networkId: chainId, hash, blockNumber: globalBlockNumber }))
                } else {
                  dispatch(finalizeTransaction({ networkId: chainId, hash, receipt }))
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
              dispatch(checkTransaction({ networkId: chainId, hash, blockNumber: globalBlockNumber }))
            })
        })

      return () => {
        stale = true
      }
    }
  }, [chainId, library, allTransactions, globalBlockNumber, dispatch, addPopup])

  return null
}

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (
  response: TransactionResponse,
  summary?: string,
  customData?: CustomData
) => void {
  const dispatch = useDispatch<AppDispatch>()

  return useCallback(
    (response: TransactionResponse, summary?: string, customData: CustomData = {}) => {
      const { hash, chainId, from } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      dispatch(addTransaction({ hash, from, networkId: chainId, customData, summary }))
    },
    [dispatch]
  )
}

// returns all the transactions for the current chain
export function useAllTransactions(): { [txHash: string]: TransactionData } {
  const { chainId } = useWeb3React()

  const state = useSelector<AppState>(state => state.transactions)

  return state[chainId] ?? {}
}

// returns whether a token has a pending approval transaction
export function useHasPendingApproval(tokenAddress: string): boolean {
  const allTransactions = useAllTransactions()
  return Object.keys(allTransactions).some(hash => {
    if (allTransactions[hash]?.receipt) {
      return false
    } else {
      return allTransactions[hash]?.customData?.approval === tokenAddress
    }
  })
}
