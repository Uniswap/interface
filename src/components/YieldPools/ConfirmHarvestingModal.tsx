import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { AppState } from 'state'
import { setAttemptingTxn, setShowConfirm, setTxHash, setYieldPoolsError } from 'state/farms/classic/actions'
import { useAppDispatch } from 'state/hooks'

export default function ConfirmHarvestingModal() {
  const showConfirm = useSelector<AppState, boolean>(state => state.farms.showConfirm)
  const attemptingTxn = useSelector<AppState, boolean>(state => state.farms.attemptingTxn)
  const txHash = useSelector<AppState, string>(state => state.farms.txHash)
  const yieldPoolsError = useSelector<AppState, string>(state => state.farms.error)
  const dispatch = useAppDispatch()

  const handleConfirmDismiss = useCallback(() => {
    dispatch(setShowConfirm(false))
    dispatch(setAttemptingTxn(false))
    dispatch(setTxHash(''))
    dispatch(setYieldPoolsError(null))
  }, [dispatch])

  const confirmationContent = useCallback(
    () =>
      yieldPoolsError ? <TransactionErrorContent onDismiss={handleConfirmDismiss} message={yieldPoolsError} /> : null,
    [handleConfirmDismiss, yieldPoolsError],
  )

  return (
    <TransactionConfirmationModal
      hash={txHash ? txHash : ''}
      isOpen={showConfirm}
      onDismiss={handleConfirmDismiss}
      attemptingTxn={attemptingTxn}
      content={confirmationContent}
      pendingText=""
    />
  )
}
