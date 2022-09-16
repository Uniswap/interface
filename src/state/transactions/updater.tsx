import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { ethers } from 'ethers'
import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { AGGREGATOR_ROUTER_SWAPPED_EVENT_TOPIC } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE, NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES } from 'hooks/useMixpanel'
import { AppPaths } from 'pages/App'
import { useSetClaimingCampaignRewardId } from 'state/campaigns/hooks'
import { getFullDisplayBalance } from 'utils/formatBalance'

import { useActiveWeb3React } from '../../hooks'
import { NotificationType, useBlockNumber, useTransactionNotify } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { SerializableTransactionReceipt, checkedTransaction, finalizeTransaction } from './actions'

export function shouldCheck(
  lastBlockNumber: number,
  tx: { addedTime: number; receipt?: SerializableTransactionReceipt; lastCheckedBlockNumber?: number },
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
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['transactions']>(state => state.transactions)

  const transactions = useMemo(() => (chainId ? state[chainId] ?? {} : {}), [chainId, state])

  // show popup on confirm

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
  const { mixpanelHandler, subgraphMixpanelHandler } = useMixpanel()
  const transactionNotify = useTransactionNotify()
  const setClaimingCampaignRewardId = useSetClaimingCampaignRewardId()[1]

  useEffect(() => {
    if (!chainId || !library || !lastBlockNumber) return
    const uniqueTransactions = [...new Set(Object.keys(transactions))]

    uniqueTransactions
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
                    effectiveGasPrice: receipt.effectiveGasPrice,
                  },
                  needCheckSubgraph: NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES.includes(transaction.type || ''),
                }),
              )

              transactionNotify({
                hash,
                notiType: receipt.status === 1 ? NotificationType.SUCCESS : NotificationType.ERROR,
                type: parseTransactionType(receipt),
                summary: parseTransactionSummary(receipt),
              })
              if (receipt.status === 1 && transaction) {
                switch (transaction.type) {
                  case 'Swap': {
                    if (transaction.arbitrary) {
                      mixpanelHandler(MIXPANEL_TYPE.SWAP_COMPLETED, {
                        arbitrary: transaction.arbitrary,
                        actual_gas: receipt.gasUsed || BigNumber.from(0),
                        gas_price: receipt.effectiveGasPrice || BigNumber.from(0),
                        tx_hash: hash,
                      })
                    }
                    break
                  }
                  case 'Collect fee': {
                    if (transaction.arbitrary) {
                      mixpanelHandler(MIXPANEL_TYPE.ELASTIC_COLLECT_FEES_COMPLETED, transaction.arbitrary)
                    }
                    break
                  }
                  case 'Increase liquidity': {
                    if (transaction.arbitrary) {
                      mixpanelHandler(MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_COMPLETED, {
                        ...transaction.arbitrary,
                        tx_hash: hash,
                      })
                    }
                    break
                  }
                  case 'Claim': {
                    // claim campaign reward successfully
                    // reset id claiming when finished
                    if (window.location.pathname.startsWith(AppPaths.CAMPAIGN)) setClaimingCampaignRewardId(null)
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
    uniqueTransactions
      .filter(hash => transactions[hash]?.needCheckSubgraph)
      .forEach(async (hash: string) => {
        const transaction = transactions[hash]
        try {
          subgraphMixpanelHandler(transaction)
        } catch (error) {
          console.log(error)
        }
      })

    // eslint-disable-next-line
  }, [chainId, library, transactions, lastBlockNumber, dispatch, parseTransactionSummary, parseTransactionType])

  return null
}
