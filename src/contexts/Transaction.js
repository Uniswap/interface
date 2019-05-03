import React, { Component, createContext, useContext, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'
import merge from 'lodash.merge'

import { useBlockEffect } from '../hooks'

const TRANSACTION = 'transaction'

const RESPONSE = 'response'
const COMPLETED = 'completed'
const RECEIPT = 'receipt'

const TransactionContext = createContext()

function removeUndefinedValues(o) {
  return Object.keys(o)
    .filter(k => o[k] !== undefined)
    .reduce((innerO, k) => {
      innerO[k] = o[k]
      return innerO
    }, {})
}

function createTransactionNode(response, completed, receipt, noUndefinedValues) {
  const node = { [RESPONSE]: response, [COMPLETED]: completed, [RECEIPT]: receipt }
  return noUndefinedValues ? removeUndefinedValues(node) : node
}

// tree creation
function createTokenDetailTree(hash, response, completed, receipt, noUndefinedValues = false) {
  return { [hash]: createTransactionNode(response, completed, receipt, noUndefinedValues) }
}

export default class Provider extends Component {
  constructor(props) {
    super(props)

    this.getTransactions = () => {
      return this.state[TRANSACTION]
    }

    this.addTransaction = (hash, response) => {
      this.setState(state => ({
        [TRANSACTION]: merge(state[TRANSACTION], createTokenDetailTree(hash, response, false))
      }))
    }

    this.updateTransaction = (hash, receipt) => {
      this.setState(state => ({
        [TRANSACTION]: merge(state[TRANSACTION], createTokenDetailTree(hash, undefined, true, receipt, true))
      }))
    }

    this.clearTransactions = () => {
      this.setState({ [TRANSACTION]: {} })
    }

    this.state = {
      [TRANSACTION]: {},
      getTransactions: this.getTransactions,
      addTransaction: this.addTransaction,
      updateTransaction: this.updateTransaction,
      clearTransactions: this.clearTransactions
    }
  }

  render() {
    return <TransactionContext.Provider value={this.state}>{this.props.children}</TransactionContext.Provider>
  }
}

export function useTransactionContext() {
  return useContext(TransactionContext)
}

export function Updater() {
  const { library, networkId } = useWeb3Context()

  const { getTransactions, updateTransaction, clearTransactions } = useTransactionContext()

  useEffect(() => {
    return () => {
      clearTransactions()
    }
  }, [clearTransactions, networkId])

  const updateTransactionHashes = useCallback(() => {
    if (library) {
      const transactions = getTransactions()
      Object.keys(transactions)
        .filter(k => !transactions[k][COMPLETED])
        .forEach(hash => {
          library.getTransactionReceipt(hash).then(receipt => {
            if (receipt) {
              updateTransaction(hash, receipt)
            }
          })
        })
    }
  }, [library, getTransactions, updateTransaction])

  useBlockEffect(updateTransactionHashes)

  return null
}

export function useAllTransactions() {
  const { getTransactions } = useTransactionContext()

  return getTransactions()
}

export function usePendingApproval(tokenAddress) {
  const allTransactions = useAllTransactions()

  return (
    Object.keys(allTransactions).filter(hash => {
      const transaction = allTransactions[hash]
      if (
        transaction.completed ||
        transaction.response.to !== tokenAddress ||
        transaction.response.data.substring(0, 10) !== ethers.utils.id('approve(address,uint256)').substring(0, 10)
      ) {
        return false
      } else {
        return true
      }
    }).length >= 1
  )
}
