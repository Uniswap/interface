import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { SwapEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, useTrace } from 'analytics'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import LibUpdater from 'lib/hooks/transactions/updater'
import { useCallback, useMemo, useState } from 'react'
import { PopupType } from 'state/application/reducer'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { L2_CHAIN_IDS } from '../../constants/chains'
import { useAddPopup } from '../application/hooks'
import { checkedTransaction, finalizeTransaction } from './reducer'
import { SerializableTransactionReceipt, TransactionDetails } from './types'

export function toSerializableReceipt(receipt: TransactionReceipt): SerializableTransactionReceipt {
  return {
    blockHash: receipt.blockHash,
    blockNumber: receipt.blockNumber,
    contractAddress: receipt.contractAddress,
    from: receipt.from,
    status: receipt.status,
    to: receipt.to,
    transactionHash: receipt.transactionHash,
    transactionIndex: receipt.transactionIndex,
  }
}

/**
 * Returns the time elapsed between page load and now,
 * if the time-to-swap mark doesn't already exist.
 *
 * We only log the time-to-swap metric for the first swap of a session.
 */
function getElapsedTime(): number {
  const timeToSwap = performance.mark('time-to-swap')
  return timeToSwap.startTime
}

export default function Updater() {
  const analyticsContext = useTrace()
  const { chainId } = useWeb3React()
  const addPopup = useAddPopup()
  const [timeToSwap, setTimeToSwap] = useState<number | undefined>(undefined)
  // speed up popup dismisall time if on L2
  const isL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId))
  const transactions = useAppSelector((state) => state.transactions)
  const pendingTransactions = useMemo(() => {
    if (!chainId || !transactions[chainId]) return {}
    return Object.values(transactions[chainId]).reduce((acc, tx) => {
      if (!tx.receipt) acc[tx.hash] = tx
      return acc
    }, {} as Record<string, TransactionDetails>)
  }, [chainId, transactions])

  const dispatch = useAppDispatch()
  const onCheck = useCallback(
    ({ chainId, hash, blockNumber }: { chainId: number; hash: string; blockNumber: number }) =>
      dispatch(checkedTransaction({ chainId, hash, blockNumber })),
    [dispatch]
  )
  const onReceipt = useCallback(
    ({ chainId, hash, receipt }: { chainId: number; hash: string; receipt: TransactionReceipt }) => {
      dispatch(
        finalizeTransaction({
          chainId,
          hash,
          receipt: toSerializableReceipt(receipt),
        })
      )

      const elapsedTime = getElapsedTime()

      sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
        // if timeToSwap was already set, we already logged this session
        time_to_swap: timeToSwap ? undefined : elapsedTime,
        hash,
        ...analyticsContext,
      })

      setTimeToSwap(elapsedTime)

      addPopup(
        {
          type: PopupType.Transaction,
          hash,
        },
        hash,
        isL2 ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      )
    },
    [addPopup, analyticsContext, dispatch, isL2, timeToSwap]
  )

  return <LibUpdater pendingTransactions={pendingTransactions} onCheck={onCheck} onReceipt={onReceipt} />
}
