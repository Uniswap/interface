import { providers } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { MenuContentItem, useIsDarkMode } from 'ui/src'
import { CopySheets, HelpCenter } from 'ui/src/components/icons'
import { UNIVERSE_CHAIN_LOGO } from 'uniswap/src/assets/chainLogos'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { cancelTransaction } from 'uniswap/src/features/transactions/slice'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { CancelConfirmationView } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/CancelConfirmationView'
import TransactionActionsModal, {
  getTransactionId,
  openSupportLink,
} from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionActionsModal'
import { getIsCancelable } from 'wallet/src/features/transactions/utils'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { openTransactionLink } from 'wallet/src/utils/linking'

export const useTransactionActions = ({
  authTrigger,
  transaction,
}: {
  authTrigger?: AuthTrigger
  transaction: TransactionDetails
}): {
  renderModals: () => JSX.Element
  openActionsModal: () => void
  openCancelModal: () => void
  menuItems: MenuContentItem[]
} => {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const { type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const dispatch = useDispatch()

  const { status, addedTime, hash, chainId } = transaction

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

  const handleExplore = useCallback((): Promise<void> => {
    setShowActionsModal(false)
    return openTransactionLink(hash, chainId)
  }, [chainId, hash])

  const handleCancelConfirmationBack = (): void => {
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

  const openCancelModal = (): void => {
    setShowCancelModal(true)
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
        />
      )}
      {showCancelModal && (
        <Modal hideHandlebar={false} name={ModalName.TransactionActions} onClose={handleCancelModalClose}>
          {transaction && (
            <CancelConfirmationView
              authTrigger={authTrigger}
              transactionDetails={transaction}
              onBack={handleCancelConfirmationBack}
              onCancel={handleCancel}
            />
          )}
        </Modal>
      )}
    </>
  )

  const chainInfo = UNIVERSE_CHAIN_INFO[chainId]
  const chainLogo = UNIVERSE_CHAIN_LOGO[chainId].explorer

  const menuItems = useMemo(() => {
    const items: MenuContentItem[] = []

    if (hash) {
      items.push({
        label: t('transaction.action.viewEtherscan', { blockExplorerName: chainInfo.explorer.name }),
        textProps: { variant: 'body2' },
        onPress: handleExplore,
        Icon: isDarkMode ? chainLogo.logoDark : chainLogo.logoLight,
      })
    }

    const transactionId = getTransactionId(transaction)
    if (transactionId) {
      items.push({
        label: t('transaction.action.copy'),
        textProps: { variant: 'body2' },
        onPress: async () => {
          await setClipboard(transactionId)
          dispatch(
            pushNotification({
              type: AppNotificationType.Copied,
              copyType: CopyNotificationType.TransactionId,
            }),
          )
        },
        Icon: CopySheets,
      })

      items.push({
        label: t('settings.action.help'),
        textProps: { variant: 'body2' },
        onPress: async (): Promise<void> => {
          await openSupportLink(transaction)
        },
        Icon: HelpCenter,
      })
    }

    return items
  }, [
    hash,
    transaction,
    t,
    chainInfo.explorer.name,
    handleExplore,
    isDarkMode,
    chainLogo.logoDark,
    chainLogo.logoLight,
    dispatch,
  ])

  return {
    openActionsModal,
    openCancelModal,
    renderModals,
    menuItems,
  }
}
