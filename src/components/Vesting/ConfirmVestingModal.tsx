import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
import { setAttemptingTxn, setShowConfirm, setTxHash, setVestingError } from 'state/vesting/actions'

export default function ConfirmVestingModal() {
  const showConfirm = useSelector<AppState, boolean>(state => state.vesting.showConfirm)
  const attemptingTxn = useSelector<AppState, boolean>(state => state.vesting.attemptingTxn)
  const txHash = useSelector<AppState, string>(state => state.vesting.txHash)
  const vestingError = useSelector<AppState, string>(state => state.vesting.error)
  const dispatch = useAppDispatch()

  const handleConfirmDismiss = useCallback(() => {
    dispatch(setShowConfirm(false))
    dispatch(setAttemptingTxn(false))
    dispatch(setTxHash(''))
    dispatch(setVestingError(null))
  }, [dispatch])

  const confirmationContent = useCallback(
    () => (vestingError ? <TransactionErrorContent onDismiss={handleConfirmDismiss} message={vestingError} /> : null),
    [handleConfirmDismiss, vestingError],
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
