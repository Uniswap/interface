import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWeb3React } from '../../hooks'
import { useAddPopup, useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { checkTransaction, finalizeTransaction } from './actions'

export default function Updater() {
  const { chainId, library } = useWeb3React()

  const lastBlockNumber = useBlockNumber()

  const dispatch = useDispatch<AppDispatch>()
  const transactions = useSelector<AppState, AppState['transactions']>(state => state.transactions)

  const allTransactions = transactions[chainId ?? -1] ?? {}

  // show popup on confirm
  const addPopup = useAddPopup()

  useEffect(() => {
    if (!chainId) return
    if (!library) return
    if (!lastBlockNumber) return

    Object.keys(allTransactions)
      .filter(hash => !allTransactions[hash].receipt)
      .filter(hash => {
        const lastChecked = allTransactions[hash].blockNumberChecked

        return !lastChecked || lastChecked < lastBlockNumber
      })
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
  }, [chainId, library, allTransactions, lastBlockNumber, dispatch, addPopup])

  return null
}
