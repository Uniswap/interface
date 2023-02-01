import { findCacheToken } from 'hooks/Tokens'
import { TRANSACTION_GROUP, TransactionDetails } from 'state/transactions/type'
import { getTransactionStatus } from 'utils/transaction'

export const NUMBERS = {
  STALL_WARNING_HEIGHT: 36,
  TRANSACTION_LINE_HEIGHT: 15,
  STALLED_MINS: 5,
}

export const isTxsPendingTooLong = (txs: TransactionDetails) => {
  const { pending: pendingTxsStatus } = getTransactionStatus(txs)
  return (
    pendingTxsStatus &&
    Date.now() - txs.addedTime > NUMBERS.STALLED_MINS * 60_000 &&
    txs.group === TRANSACTION_GROUP.SWAP
  )
}

export const getTokenLogo = (address: string | undefined) => findCacheToken(address ?? '')?.logoURI ?? ''
