import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWeb3React } from '../../hooks'
import { useAddPopup, useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { checkTransaction, finalizeTransaction } from './actions'

export default function Updater() {
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
                  dispatch(checkTransaction({ chainId, hash, blockNumber: globalBlockNumber }))
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
              }
            })
            .catch(() => {
              dispatch(checkTransaction({ chainId, hash, blockNumber: globalBlockNumber }))
            })
        })

      return () => {
        stale = true
      }
    }
  }, [chainId, library, allTransactions, globalBlockNumber, dispatch, addPopup])

  return null
}
