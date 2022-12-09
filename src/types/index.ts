export type TransactionFlowState = {
  showConfirm: boolean
  attemptingTxn: boolean
  errorMessage: string | undefined
  txHash: string | undefined
  pendingText: string | undefined
}
export const TRANSACTION_STATE_DEFAULT: TransactionFlowState = {
  showConfirm: false,
  attemptingTxn: false,
  errorMessage: '',
  txHash: undefined,
  pendingText: '',
}
