export const elo = 1
// import { ChainId } from '@swapr/sdk'
// import { providers, Signer } from 'ethers'
// import { useCallback, useEffect, useMemo } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import { useActiveWeb3React } from '../../hooks'
// import { useBridge } from '../../hooks/useArbBridge'
// import { retry, RetryableError, RetryOptions } from '../../utils/retry'
// import { updateBlockNumber } from '../application/actions'
// import { useAddPopup, useBlockNumber, useBlockNumberPair } from '../application/hooks'
// import { AppState } from '../index'
// import { checkedTransaction, finalizeTransaction } from './actions'
// import { useBridgeTransactions } from './hooks'

// interface TxInterface {
//   addedTime: number
//   receipt?: Record<string, any>
//   lastCheckedBlockNumber?: number
// }

// export function shouldCheck(lastBlockNumber: number, tx: TxInterface): boolean {
//   if (tx.receipt) return false
//   if (!tx.lastCheckedBlockNumber) return true
//   const blocksSinceCheck = lastBlockNumber - tx.lastCheckedBlockNumber
//   if (blocksSinceCheck < 1) return false
//   const minutesPending = (new Date().getTime() - tx.addedTime) / 1000 / 60
//   if (minutesPending > 60) {
//     // every 10 blocks if pending for longer than an hour
//     return blocksSinceCheck > 9
//   } else if (minutesPending > 5) {
//     // every 3 blocks if pending more than 5 minutes
//     return blocksSinceCheck > 2
//   } else {
//     // otherwise every block
//     return true
//   }
// }

// const RETRY_OPTIONS_BY_CHAIN_ID: { [chainId: number]: RetryOptions } = {
//   [ChainId.ARBITRUM_ONE]: { n: 10, minWait: 250, maxWait: 1000 },
//   [ChainId.ARBITRUM_RINKEBY]: { n: 10, minWait: 250, maxWait: 1000 }
// }
// const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 1, minWait: 0, maxWait: 0 }

// export default function Updater(): null {
//   const { chainId } = useActiveWeb3React()
//   const bridge = useBridge()
//   const [l1lastBlockNumber, l2lastBlockNumber] = useBlockNumberPair()
//   const transactions = useBridgeTransactions()

//   const dispatch = useDispatch()

//   // show popup on confirm
//   const addPopup = useAddPopup()

//   const getReceipt = useCallback(
//     (hash: string, provider: providers.JsonRpcProvider) => {
//       if (!bridge || !chainId) throw new Error('No bridge or chainId')
//       const retryOptions = RETRY_OPTIONS_BY_CHAIN_ID[chainId] ?? DEFAULT_RETRY_OPTIONS
//       return retry(
//         () =>
//           provider.getTransactionReceipt(hash).then(receipt => {
//             if (receipt === null) {
//               console.debug('Retrying for hash', hash)
//               throw new RetryableError()
//             }
//             return receipt
//           }),
//         retryOptions
//       )
//     },
//     [bridge, chainId]
//   )

//   useEffect(() => {
//     if (!chainId || !bridge || !l1lastBlockNumber || !l2lastBlockNumber) return

//     const cancels = Object.keys(transactions)
//       .filter(hash => shouldCheck(lastBlockNumber, transactions[hash]))
//       .map(hash => {
//         const { promise, cancel } = getReceipt(hash)
//         promise
//           .then(receipt => {
//             if (receipt) {
//               dispatch(
//                 finalizeTransaction({
//                   chainId,
//                   hash,
//                   receipt: {
//                     blockHash: receipt.blockHash,
//                     blockNumber: receipt.blockNumber,
//                     contractAddress: receipt.contractAddress,
//                     from: receipt.from,
//                     status: receipt.status,
//                     to: receipt.to,
//                     transactionHash: receipt.transactionHash,
//                     transactionIndex: receipt.transactionIndex
//                   }
//                 })
//               )

//               addPopup({
//                 txn: {
//                   hash,
//                   success: receipt.status === 1,
//                   summary: transactions[hash]?.summary
//                 }
//               })

//               // the receipt was fetched before the block, fast forward to that block to trigger balance updates
//               if (receipt.blockNumber > lastBlockNumber) {
//                 dispatch(updateBlockNumber({ chainId, blockNumber: receipt.blockNumber }))
//               }
//             } else {
//               dispatch(checkedTransaction({ chainId, hash, blockNumber: lastBlockNumber }))
//             }
//           })
//           .catch(error => {
//             if (!error.isCancelledError) {
//               console.error(`Failed to check transaction hash: ${hash}`, error)
//             }
//           })
//         return cancel
//       })

//     return () => {
//       cancels.forEach(cancel => cancel())
//     }
//   }, [chainId, library, transactions, lastBlockNumber, dispatch, addPopup, getReceipt])

//   return null
// }
