import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWeb3React } from '../../hooks'
import { useAddPopup, useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { checkTransaction, finalizeTransaction, updateTransactionCount } from './actions'
import useSWR from 'swr'

export default function Updater() {
  const { chainId, account, library } = useWeb3React()

  const lastBlockNumber = useBlockNumber()

  const dispatch = useDispatch<AppDispatch>()
  const transactions = useSelector<AppState>(state => state.transactions)

  const allTransactions = transactions[chainId] ?? {}

  // show popup on confirm
  const addPopup = useAddPopup()

  const { data: transactionCount } = useSWR<number | null>(['accountNonce', account, lastBlockNumber], () => {
    if (!account) return null
    return library.getTransactionCount(account, 'latest')
  })

  useEffect(() => {
    if (transactionCount === null) return
    dispatch(updateTransactionCount({ address: account, transactionCount, chainId }))
  }, [transactionCount, account, chainId, dispatch])

  useEffect(() => {
    if (typeof chainId === 'number' && library) {
      Object.keys(allTransactions)
        .filter(hash => !allTransactions[hash].receipt)
        .filter(
          hash =>
            !allTransactions[hash].blockNumberChecked || allTransactions[hash].blockNumberChecked < lastBlockNumber
        )
        .forEach(hash => {
          library
            .getTransactionReceipt(hash)
            .then(receipt => {
              if (!receipt) {
                dispatch(checkTransaction({ chainId, hash, blockNumber: lastBlockNumber }))
              } else {
                dispatch(
                  finalizeTransaction({
                    chainId,
                    hash,
                    receipt: {
                      blockHash: receipt.blockHash,
                      blockNumber: receipt.blockNumber,
                      contractAddress: receipt.contractAddress,
                      from: receipt.from,
                      status: receipt.status,
                      to: receipt.to,
                      transactionHash: receipt.transactionHash,
                      transactionIndex: receipt.transactionIndex
                    }
                  })
                )
                // add success or failure popup
                if (receipt.status === 1) {
                  addPopup({
                    txn: {
                      hash,
                      success: true,
                      summary: allTransactions[hash]?.summary
                    }
                  })
                } else {
                  addPopup({
                    txn: { hash, success: false, summary: allTransactions[hash]?.summary }
                  })
                }
              }
            })
            .catch(error => {
              console.error(`failed to check transaction hash: ${hash}`, error)
            })
        })
    }
  }, [chainId, library, allTransactions, lastBlockNumber, dispatch, addPopup])

  return null
}
