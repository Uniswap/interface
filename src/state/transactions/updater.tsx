import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { ethers } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'

import { useActiveWeb3React } from '../../hooks'
import { useAddPopup, useBlockNumber, useExchangeClient } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { checkedTransaction, finalizeTransaction, checkedSubgraph } from './actions'
import { AGGREGATOR_ROUTER_SWAPPED_EVENT_TOPIC } from 'constants/index'
import { getFullDisplayBalance } from 'utils/formatBalance'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { TRANSACTION_SWAP_AMOUNT_USD } from 'apollo/queries'

export function shouldCheck(
  lastBlockNumber: number,
  tx: { addedTime: number; receipt?: {}; lastCheckedBlockNumber?: number },
): boolean {
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

export default function Updater(): null {
  const { chainId, library } = useActiveWeb3React()

  const lastBlockNumber = useBlockNumber()
  const apolloClient = useExchangeClient()

  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['transactions']>(state => state.transactions)

  const transactions = chainId ? state[chainId] ?? {} : {}

  // show popup on confirm
  const addPopup = useAddPopup()

  const parseTransactionType = useCallback(
    (receipt: TransactionReceipt): string | undefined => {
      return transactions[receipt.transactionHash]?.type
    },
    [transactions],
  )

  const parseTransactionSummary = useCallback(
    (receipt: TransactionReceipt): string | undefined => {
      let log = undefined

      for (let i = 0; i < receipt.logs.length; i++) {
        if (receipt.logs[i].topics.includes(AGGREGATOR_ROUTER_SWAPPED_EVENT_TOPIC)) {
          log = receipt.logs[i]
          break
        }
      }

      // No event log includes Swapped event topic
      if (!log) {
        return transactions[receipt.transactionHash]?.summary
      }

      // Parse summary message for Swapped event
      if (!transactions[receipt.transactionHash] || !transactions[receipt.transactionHash]?.arbitrary) {
        return transactions[receipt.transactionHash]?.summary
      }

      const inputSymbol = transactions[receipt.transactionHash]?.arbitrary?.inputSymbol
      const outputSymbol = transactions[receipt.transactionHash]?.arbitrary?.outputSymbol
      const inputDecimals = transactions[receipt.transactionHash]?.arbitrary?.inputDecimals
      const outputDecimals = transactions[receipt.transactionHash]?.arbitrary?.outputDecimals
      const withRecipient = transactions[receipt.transactionHash]?.arbitrary?.withRecipient

      if (!inputSymbol || !outputSymbol || !inputDecimals || !outputDecimals) {
        return transactions[receipt.transactionHash]?.summary
      }

      const decodedValues = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'address', 'address', 'uint256', 'uint256'],
        log.data,
      )

      const inputAmount = getFullDisplayBalance(BigNumber.from(decodedValues[4].toString()), inputDecimals, 3)
      const outputAmount = getFullDisplayBalance(BigNumber.from(decodedValues[5].toString()), outputDecimals, 3)

      const base = `${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`

      return `${base} ${withRecipient ?? ''}`
    },
    [transactions],
  )
  const { mixpanelHandler } = useMixpanel()

  useEffect(() => {
    if (!chainId || !library || !lastBlockNumber) return

    Object.keys(transactions)
      .filter(hash => shouldCheck(lastBlockNumber, transactions[hash]))
      .forEach(hash => {
        library
          .getTransactionReceipt(hash)
          .then(receipt => {
            if (receipt) {
              const transaction = transactions[receipt.transactionHash]
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
                    transactionIndex: receipt.transactionIndex,
                    gasUsed: receipt.gasUsed,
                  },
                  needCheckSubgraph: transaction.type === 'Swap',
                }),
              )

              addPopup(
                {
                  txn: {
                    hash,
                    success: receipt.status === 1,
                    type: parseTransactionType(receipt),
                    summary: parseTransactionSummary(receipt),
                  },
                },
                hash,
              )
              if (receipt.status === 1 && transaction && transaction.arbitrary) {
                switch (transaction.type) {
                  case 'Create pool': {
                    mixpanelHandler(MIXPANEL_TYPE.CREATE_POOL_COMPLETED, {
                      token_1: transaction.arbitrary.token_1,
                      token_2: transaction.arbitrary.token_2,
                      amp: transaction.arbitrary.amp,
                    })
                    break
                  }
                  case 'Add liquidity': {
                    mixpanelHandler(MIXPANEL_TYPE.ADD_LIQUIDITY_COMPLETED, {
                      token_1: transaction.arbitrary.token_1,
                      token_2: transaction.arbitrary.token_2,
                      add_liquidity_method: transaction.arbitrary.add_liquidity_method,
                      amp: transaction.arbitrary.amp,
                    })
                    break
                  }
                  case 'Remove liquidity': {
                    mixpanelHandler(MIXPANEL_TYPE.REMOVE_LIQUIDITY_COMPLETED, {
                      token_1: transaction.arbitrary.token_1,
                      token_2: transaction.arbitrary.token_2,
                      remove_liquidity_method: transaction.arbitrary.remove_liquidity_method,
                      amp: transaction.arbitrary.amp,
                    })
                    break
                  }
                  default:
                    break
                }
              }
            } else {
              dispatch(checkedTransaction({ chainId, hash, blockNumber: lastBlockNumber }))
            }
          })
          .catch(error => {
            console.error(`failed to check transaction hash: ${hash}`, error)
          })
      })
    Object.keys(transactions)
      .filter(hash => transactions[hash]?.needCheckSubgraph)
      .forEach(hash => {
        const transaction = transactions[hash]
        if (transaction.type === 'Swap') {
          apolloClient
            .query({
              query: TRANSACTION_SWAP_AMOUNT_USD,
              variables: {
                transactionHash: hash,
              },
              fetchPolicy: 'network-only',
            })
            .then(res => {
              if (res.data?.transaction?.swaps) {
                mixpanelHandler(MIXPANEL_TYPE.SWAP_COMPLETED, {
                  arbitrary: transaction.arbitrary,
                  actual_gas: transaction.receipt?.gasUsed || '',
                  amountUSD: Math.max(
                    res.data.transaction.swaps.map((s: any) => parseFloat(s.amountUSD).toPrecision(3)),
                  ),
                })
                dispatch(checkedSubgraph({ chainId, hash }))
              }
            })
            .catch(error => console.log(error))
        }
      })

    // eslint-disable-next-line
  }, [
    chainId,
    library,
    transactions,
    lastBlockNumber,
    dispatch,
    addPopup,
    parseTransactionSummary,
    parseTransactionType,
  ])

  return null
}
