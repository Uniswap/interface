import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { poll } from '@ethersproject/web'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { useActiveWeb3React } from '../../hooks/web3'
import { retry, RetryableError, RetryOptions } from '../../utils/retry'
import { useAddPopup, useBlockNumber } from '../application/hooks'
import { updateBlockNumber } from '../application/reducer'
import { checkedTransaction, finalizeTransaction } from './actions'

interface TxInterface {
  addedTime: number
  receipt?: Record<string, any>
  lastCheckedBlockNumber?: number
}

export function shouldCheck(lastBlockNumber: number, tx: TxInterface): boolean {
  if (tx.receipt) return false
  if (!tx.lastCheckedBlockNumber) return true
  const blocksSinceCheck = lastBlockNumber - tx.lastCheckedBlockNumber
  if (blocksSinceCheck < 1) return false
  const minutesPending = (new Date().getTime() - tx.addedTime) / 1000 / 60
  if (minutesPending > 60) {
    // every 10 blocks if pending for longer than an hour
    return blocksSinceCheck > 9
  } else if (minutesPending > 5) {
    // every 3 blocks if pending more than 5 minutes
    return blocksSinceCheck > 2
  } else {
    // otherwise every block
    return true
  }
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 1, minWait: 0, maxWait: 0 }

export default function Updater(): null {
  const { chainId, library } = useActiveWeb3React()

  const lastBlockNumber = useBlockNumber()

  const dispatch = useAppDispatch()
  const state = useAppSelector((state) => state.transactions)

  const transactions = useMemo(() => (chainId ? state[chainId] ?? {} : {}), [chainId, state])

  // show popup on confirm
  const addPopup = useAddPopup()

  const getReceipt = useCallback(
    (hash: string) => {
      const myGetTransactionReceipt = async (
        transactionHash: string | Promise<string>
      ): Promise<TransactionReceipt | null | undefined> => {
        if (!library) {
          return null
        }
        await library.getNetwork()

        transactionHash = await transactionHash

        const params = { transactionHash: library.formatter.hash(transactionHash, true) }
        return poll(
          async () => {
            const result = await library.perform('getTransactionReceipt', params)

            if (result == null) {
              if (library._emitted['t:' + transactionHash] == null) {
                return null
              }
              return undefined
            }

            result.from = result.from.substring(0, 3) === 'xdc' ? '0x' + result.from.substring(3) : result.from
            result.to = result.to.substring(0, 3) === 'xdc' ? '0x' + result.to.substring(3) : result.to
            result.logs = result.logs.map((log: any) => ({
              ...log,
              address: log.address.substring(0, 3) === 'xdc' ? '0x' + log.address.substring(3) : log.address.to,
            }))

            // "geth-etc" returns receipts before they are ready
            if (result.blockHash == null) {
              return undefined
            }

            const receipt = library.formatter.receipt(result)

            if (receipt.blockNumber == null) {
              receipt.confirmations = 0
            } else if (receipt.confirmations == null) {
              const blockNumber = await library._getInternalBlockNumber(100 + 2 * library.pollingInterval)

              // Add the confirmations using the fast block number (pessimistic)
              let confirmations = blockNumber - receipt.blockNumber + 1
              if (confirmations <= 0) {
                confirmations = 1
              }
              receipt.confirmations = confirmations
            }

            return receipt
          },
          { oncePoll: library }
        )
      }

      if (!library || !chainId) throw new Error('No library or chainId')
      return retry(() => {
        console.log(hash)
        return myGetTransactionReceipt(hash)
          .then((receipt) => {
            if (receipt === null) {
              console.debug('Retrying for hash', hash)
              throw new RetryableError()
            }
            console.log(receipt, '---------')
            return receipt
          })
          .catch((e) => {
            console.log(e)
          })
      }, DEFAULT_RETRY_OPTIONS)
    },
    [chainId, library]
  )

  useEffect(() => {
    if (!chainId || !library || !lastBlockNumber) return

    const cancels = Object.keys(transactions)
      .filter((hash) => shouldCheck(lastBlockNumber, transactions[hash]))
      .map((hash) => {
        const { promise, cancel } = getReceipt(hash)
        promise
          .then((receipt) => {
            if (receipt) {
              const payload = {
                chainId,
                hash,
                receipt: {
                  blockHash: receipt.blockHash,
                  blockNumber: receipt.blockNumber,
                  contractAddress: receipt.contractAddress,
                  from: receipt.from.substring(0, 3) === 'xdc' ? '0x' + receipt.from.substring(3) : receipt.from,
                  status: receipt.status,
                  to: receipt.to.substring(0, 3) === 'xdc' ? '0x' + receipt.to.substring(3) : receipt.to,
                  transactionHash: receipt.transactionHash,
                  transactionIndex: receipt.transactionIndex,
                },
              }
              console.log(payload)
              dispatch(finalizeTransaction(payload))

              addPopup(
                {
                  txn: {
                    hash,
                  },
                },
                hash,
                DEFAULT_TXN_DISMISS_MS
              )

              // the receipt was fetched before the block, fast forward to that block to trigger balance updates
              if (receipt.blockNumber > lastBlockNumber) {
                dispatch(updateBlockNumber({ chainId, blockNumber: receipt.blockNumber }))
              }
            } else {
              dispatch(checkedTransaction({ chainId, hash, blockNumber: lastBlockNumber }))
            }
          })
          .catch((error) => {
            if (!error.isCancelledError) {
              console.error(`Failed to check transaction hash: ${hash}`, error)
            }
          })
        return cancel
      })

    return () => {
      cancels.forEach((cancel) => cancel())
    }
  }, [chainId, library, transactions, lastBlockNumber, dispatch, addPopup, getReceipt])

  return null
}
