import { providers } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { isWeb } from 'ui/src'
import { Clear, CopySheets, HelpCenter } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { cancelTransaction, finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import { isBridge, isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  isFinalizedTx,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { MenuContentItem } from 'wallet/src/components/menu/types'
import { CancelConfirmationView } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/CancelConfirmationView'
import TransactionActionsModal, {
  TransactionActionItem,
} from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionActionsModal'
import { getIsCancelable } from 'wallet/src/features/transactions/utils'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { openFORSupportLink } from 'wallet/src/utils/linking'

enum SupportLinkParams {
  WalletAddress = 'tf_11041337007757',
  ReportType = 'tf_7005922218125',
  IssueType = 'tf_13686083567501',
  TransactionId = 'tf_9807731675917',
}

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
  const { type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const dispatch = useDispatch()

  const { status, addedTime } = transaction

  const isCancelable = !readonly && getIsCancelable(transaction)

  const baseActionItems = useTransactionActionItems(transaction)

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

  const menuItems = useMemo(() => {
    const menuContentItems: MenuContentItem[] = baseActionItems.map((item) => ({
      label: item.label,
      textProps: { variant: 'body2' },
      onPress: item.onPress,
      Icon: item.icon,
    }))

    return { baseActionItems, menuContentItems }
  }, [baseActionItems])

  const renderModals = (): JSX.Element => (
    <>
      {showActionsModal && (
        <TransactionActionsModal
          msTimestampAdded={addedTime}
          showCancelButton={isCancelable}
          menuItems={menuItems.baseActionItems}
          onCancel={(): void => {
            setShowActionsModal(false)
            setShowCancelModal(true)
          }}
          onClose={handleActionsModalClose}
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

  return {
    openActionsModal,
    openCancelModal,
    renderModals,
    menuItems: menuItems.menuContentItems,
  }
}

function useTransactionActionItems(transactionDetails: TransactionDetails): TransactionActionItem[] {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const items: TransactionActionItem[] = []
  const transactionId = getTransactionId(transactionDetails)

  const onRampProviderName =
    transactionDetails.typeInfo.type === TransactionType.OnRampPurchase ||
    transactionDetails.typeInfo.type === TransactionType.OnRampTransfer ||
    transactionDetails.typeInfo.type === TransactionType.OffRampSale
      ? transactionDetails.typeInfo.serviceProvider?.name
      : undefined

  if (transactionId) {
    const copyLabel = onRampProviderName
      ? t('transaction.action.copyProvider', {
          providerName: onRampProviderName,
        })
      : t('transaction.action.copy')

    items.push({
      key: ElementName.Copy,
      label: copyLabel,
      icon: CopySheets,
      onPress: async (): Promise<void> => {
        await setClipboard(transactionId)
        dispatch(
          pushNotification({
            type: AppNotificationType.Copied,
            copyType: CopyNotificationType.TransactionId,
          }),
        )
      },
    })
  }

  items.push({
    key: ElementName.GetHelp,
    label: t('settings.action.help'),
    icon: HelpCenter,
    onPress: async (): Promise<void> => {
      await openSupportLink(transactionDetails)
    },
  })

  if (
    (isClassic(transactionDetails) || isBridge(transactionDetails)) &&
    !isFinalizedTx(transactionDetails) &&
    transactionDetails.options.timeoutTimestampMs &&
    transactionDetails.options.timeoutTimestampMs < Date.now()
  ) {
    items.push({
      key: ElementName.ClearPending,
      label: t('transaction.action.clear'),
      icon: Clear,
      onPress: async (): Promise<void> => {
        dispatch(finalizeTransaction({ ...transactionDetails, status: TransactionStatus.Failed }))
      },
    })
  }

  return items
}

async function openSupportLink(transactionDetails: TransactionDetails): Promise<void> {
  const params = new URLSearchParams()
  switch (transactionDetails.typeInfo.type) {
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
    case TransactionType.OffRampSale:
      return openFORSupportLink(transactionDetails.typeInfo.serviceProvider)
    default:
      params.append(SupportLinkParams.WalletAddress, transactionDetails.ownerAddress ?? '') // Wallet Address
      params.append(SupportLinkParams.ReportType, isWeb ? 'uniswap_extension_issue' : 'uw_ios_app') // Report Type Dropdown
      params.append(SupportLinkParams.IssueType, 'uw_transaction_details_page_submission') // Issue type Dropdown
      params.append(SupportLinkParams.TransactionId, transactionDetails.hash ?? 'N/A') // Transaction id
      return openUri(uniswapUrls.helpRequestUrl + '?' + params.toString()).catch((e) =>
        logger.error(e, { tags: { file: 'TransactionActionsModal', function: 'getHelpLink' } }),
      )
  }
}

function getTransactionId(transactionDetails: TransactionDetails): string | undefined {
  switch (transactionDetails.typeInfo.type) {
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
      return transactionDetails.typeInfo.id
    case TransactionType.OffRampSale:
      return transactionDetails.typeInfo.providerTransactionId
    default:
      return transactionDetails.hash
  }
}
