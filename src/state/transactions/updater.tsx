import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { SwapEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, useTrace } from 'analytics'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import LibUpdater from 'lib/hooks/transactions/updater'
import { useCallback, useMemo } from 'react'
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

function getElapsedTime(): number | undefined {
  // Only log this metric for the first swap of a session.
  const ttsMarks = performance.getEntriesByName('tts-mark', 'mark')

  if (ttsMarks.length > 0) {
    return
  }

  performance.mark('tts-mark')
  return performance.now() / 1000 // time-to-swap in seconds
}

export default function Updater() {
  const analyticsContext = useTrace()
  const { chainId } = useWeb3React()
  const addPopup = useAddPopup()
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

      sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
        tts: getElapsedTime(),
        hash,
        ...analyticsContext,
      })

      addPopup(
        {
          type: PopupType.Transaction,
          hash,
        },
        hash,
        isL2 ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      )
    },
    [addPopup, analyticsContext, dispatch, isL2]
  )

  return <LibUpdater pendingTransactions={pendingTransactions} onCheck={onCheck} onReceipt={onReceipt} />
}
