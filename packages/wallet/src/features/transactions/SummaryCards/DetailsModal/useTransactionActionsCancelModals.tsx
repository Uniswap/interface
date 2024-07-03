import { providers } from 'ethers'
import { useEffect, useState } from 'react'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyId } from 'uniswap/src/types/currency'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { AuthTrigger } from 'wallet/src/features/auth/types'
import { CancelConfirmationView } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/CancelConfirmationView'
import TransactionActionsModal from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionActionsModal'
import { cancelTransaction } from 'wallet/src/features/transactions/slice'
import { TransactionDetails, TransactionStatus, TransactionType } from 'wallet/src/features/transactions/types'
import { getIsCancelable } from 'wallet/src/features/transactions/utils'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'
import { openMoonpayTransactionLink, openTransactionLink } from 'wallet/src/utils/linking'

export const useTransactionActionsCancelModals = ({
  authTrigger,
  onNavigateAway,
  transaction,
}: {
  authTrigger?: AuthTrigger
  onNavigateAway?: () => void
  transaction: TransactionDetails
}): {
  renderModals: () => JSX.Element
  openActionsModal: () => void
} => {
  const { navigateToTokenDetails } = useWalletNavigation()

  const { type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const dispatch = useAppDispatch()

  const { status, addedTime, hash, chainId, typeInfo } = transaction

  const isCancelable = !readonly && getIsCancelable(transaction)

  const handleCancel = (txRequest: providers.TransactionRequest): void => {
    if (!transaction) {
      return
    }
    dispatch(
      cancelTransaction({
        chainId: transaction.chainId,
        id: transaction.id,
        address: transaction.from,
        cancelRequest: txRequest,
      }),
    )
    setShowCancelModal(false)
  }

  const handleCancelModalClose = (): void => {
    setShowCancelModal(false)
  }

  const handleActionsModalClose = (): void => {
    setShowActionsModal(false)
  }

  const handleExplore = (): Promise<void> => {
    setShowActionsModal(false)
    return openTransactionLink(hash, chainId)
  }

  const handleViewMoonpay = (): Promise<void> | undefined => {
    if (transaction.typeInfo.type === TransactionType.FiatPurchase) {
      setShowActionsModal(false)
      return openMoonpayTransactionLink(transaction.typeInfo)
    }
    return undefined
  }

  const handleViewTokenDetails = (currencyId: CurrencyId): void | undefined => {
    if (transaction.typeInfo.type === TransactionType.Swap) {
      setShowActionsModal(false)
      navigateToTokenDetails(currencyId)
      onNavigateAway?.()
    }
    return undefined
  }

  const handleCancelConfirmationBack = (): void => {
    setShowActionsModal(true)
    setShowCancelModal(false)
  }

  useEffect(() => {
    if (status !== TransactionStatus.Pending) {
      setShowCancelModal(false)
    }
  }, [status])

  const openActionsModal = (): void => {
    setShowActionsModal(true)
  }

  const renderModals = (): JSX.Element => (
    <>
      {showActionsModal && (
        <TransactionActionsModal
          msTimestampAdded={addedTime}
          showCancelButton={isCancelable}
          transactionDetails={transaction}
          onCancel={(): void => {
            setShowActionsModal(false)
            setShowCancelModal(true)
          }}
          onClose={handleActionsModalClose}
          onExplore={handleExplore}
          onViewMoonpay={
            typeInfo.type === TransactionType.FiatPurchase && typeInfo.explorerUrl ? handleViewMoonpay : undefined
          }
          onViewTokenDetails={typeInfo.type === TransactionType.Swap ? handleViewTokenDetails : undefined}
        />
      )}
      {showCancelModal && (
        <BottomSheetModal hideHandlebar={false} name={ModalName.TransactionActions} onClose={handleCancelModalClose}>
          {transaction && (
            <CancelConfirmationView
              authTrigger={authTrigger}
              transactionDetails={transaction}
              onBack={handleCancelConfirmationBack}
              onCancel={handleCancel}
            />
          )}
        </BottomSheetModal>
      )}
    </>
  )

  return {
    openActionsModal,
    renderModals,
  }
}
