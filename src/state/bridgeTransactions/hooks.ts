import { useSelector } from 'react-redux'
import {
  bridgePendingTxsSelector,
  bridgeOwnedTxsSelector,
  bridgeL1DepositsSelector,
  bridgePendingWithdrawalsSelector,
  bridgeTxsSummarySelector
} from './selectors'

export const useBridgeAllTransactions = () => {
  return useSelector(bridgeOwnedTxsSelector)
}

export const useBridgePendingTransactions = () => {
  return useSelector(bridgePendingTxsSelector)
}

export const useBridgeL1Deposits = () => {
  return useSelector(bridgeL1DepositsSelector)
}

export const useBridgePendingWithdrawals = () => {
  return useSelector(bridgePendingWithdrawalsSelector)
}

export const useBridgeTransactionsSummary = () => {
  return useSelector(bridgeTxsSummarySelector)
}
