import { providers } from 'ethers/lib/ethers'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Eye, Flag } from 'ui/src/components/icons'
import { Clear } from 'ui/src/components/icons/Clear'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { HelpCenter } from 'ui/src/components/icons/HelpCenter'
import { X } from 'ui/src/components/icons/X'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { submitActivitySpamReport } from 'uniswap/src/features/reporting/reports'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  CancelConfirmationView,
  PlanCancellationInfo,
} from 'uniswap/src/features/transactions/components/cancel/CancelConfirmationView'
import { useIsCancelable } from 'uniswap/src/features/transactions/hooks/useIsCancelable'
import { useSelectTransaction } from 'uniswap/src/features/transactions/hooks/useSelectTransaction'
import {
  cancelPlanStep,
  cancelRemoteUniswapXOrder,
  cancelTransaction,
  finalizeTransaction,
} from 'uniswap/src/features/transactions/slice'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'
import { useIsActivityHidden } from 'uniswap/src/features/visibility/hooks/useIsActivityHidden'
import { setActivityVisibility } from 'uniswap/src/features/visibility/slice'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { openFORSupportLink, openUri } from 'uniswap/src/utils/linking'
import { setClipboard } from 'utilities/src/clipboard/clipboard'
import { logger } from 'utilities/src/logger/logger'
import { isWebPlatform } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

enum SupportLinkParams {
  WalletAddress = 'tf_11041337007757',
  ReportType = 'tf_7005922218125',
  IssueType = 'tf_13686083567501',
  TransactionId = 'tf_9807731675917',
}

export function useTransactionActions({
  transaction,
  authTrigger,
  onClose,
  onReportSuccess,
  onUnhideTransaction,
  onCopySuccess,
}: {
  transaction: TransactionDetails
  authTrigger?: AuthTrigger
  onClose?: () => void
  onReportSuccess?: () => void
  onUnhideTransaction?: () => void
  onCopySuccess?: () => void
}): {
  renderModals: () => JSX.Element
  openCancelModal: () => void
  menuItems: MenuOptionItem[]
} {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { evmAccount } = useWallet()
  const readonly = !evmAccount || evmAccount.accountType === AccountType.Readonly

  const { value: isCancelModalVisible, setTrue: showCancelModal, setFalse: hideCancelModal } = useBooleanState(false)
  const { value: isReportModalVisible, setTrue: showReportModal, setFalse: hideReportModal } = useBooleanState(false)

  const { status } = transaction

  const isCancelable = useIsCancelable(transaction) && !readonly

  // Check if this transaction exists in local Redux state (vs only in remote activity feed)
  const isInLocalState =
    useSelectTransaction({
      address: transaction.from,
      chainId: transaction.chainId,
      txId: transaction.id,
    }) !== undefined

  const baseActionItems = useTransactionActionItems({
    transactionDetails: transaction,
    onUnhideTransaction,
    showReportModal,
    onCopySuccess,
  })

  const handleCancel = useEvent(
    (txRequest: providers.TransactionRequest, planCancellationInfo?: PlanCancellationInfo): void => {
      if (planCancellationInfo?.isPlanCancellation) {
        dispatch(
          cancelPlanStep({
            chainId: transaction.chainId,
            id: transaction.id,
            address: transaction.from,
            cancelRequest: txRequest,
            planId: planCancellationInfo.planId,
            cancelableStepInfo: planCancellationInfo.cancelableStepInfo,
          }),
        )
      } else if (!isInLocalState && isUniswapX(transaction)) {
        // Remote UniswapX order (e.g. submitted from web app) — bypass Redux cancelTransaction
        // reducer and directly submit the Permit2 nonce invalidation transaction via saga.
        dispatch(
          cancelRemoteUniswapXOrder({
            chainId: transaction.chainId,
            address: transaction.from,
            orderHash: (transaction as UniswapXOrderDetails).orderHash ?? transaction.id,
            cancelRequest: txRequest,
          }),
        )
      } else {
        dispatch(
          cancelTransaction({
            chainId: transaction.chainId,
            id: transaction.id,
            address: transaction.from,
            cancelRequest: txRequest,
          }),
        )
      }
      hideCancelModal()
      onClose?.()
    },
  )

  const onReportTransaction = useEvent((): void => {
    // Send analytics report
    submitActivitySpamReport({ transactionDetails: transaction })
    // Set visibility to false
    dispatch(setActivityVisibility({ transactionId: transaction.id, isVisible: false }))
    // Report success
    onReportSuccess?.()
    dispatch(
      pushNotification({
        type: AppNotificationType.Success,
        title: t('common.reported'),
      }),
    )
    // close modal
    onClose?.()
  })

  useEffect(() => {
    if (status !== TransactionStatus.Pending) {
      hideCancelModal()
    }
  }, [status, hideCancelModal])

  const menuItems = useMemo(() => {
    const items = [...baseActionItems]
    if (isCancelable) {
      items.push({
        label: t('transaction.action.cancel.button'),
        onPress: showCancelModal,
        Icon: X,
        iconColor: '$statusCritical',
        textColor: '$statusCritical',
      })
    }
    return items
  }, [baseActionItems, isCancelable, t, showCancelModal])

  const renderModals = useCallback(
    (): JSX.Element => (
      <>
        {isCancelModalVisible && (
          <Modal hideHandlebar={false} name={ModalName.TransactionCancellation} onClose={hideCancelModal}>
            <CancelConfirmationView
              authTrigger={authTrigger}
              transactionDetails={transaction}
              onBack={hideCancelModal}
              onCancel={handleCancel}
            />
          </Modal>
        )}
        <WarningModal
          caption={t('reporting.activity.confirm.subtitle')}
          rejectText={t('common.button.cancel')}
          acknowledgeText={t('common.report')}
          icon={<Flag color="$neutral1" size="$icon.24" />}
          isOpen={isReportModalVisible}
          modalName={ModalName.ReportActivityConfirmation}
          severity={WarningSeverity.None}
          title={t('reporting.activity.confirm.title')}
          onClose={hideReportModal}
          onAcknowledge={onReportTransaction}
        />
      </>
    ),
    [
      isCancelModalVisible,
      authTrigger,
      transaction,
      handleCancel,
      hideReportModal,
      isReportModalVisible,
      onReportTransaction,
      hideCancelModal,
      t,
    ],
  )

  return {
    openCancelModal: showCancelModal,
    renderModals,
    menuItems,
  }
}

function useTransactionActionItems({
  transactionDetails,
  onUnhideTransaction,
  showReportModal,
  onCopySuccess,
}: {
  transactionDetails: TransactionDetails
  onUnhideTransaction?: () => void
  showReportModal: () => void
  onCopySuccess?: () => void
}): MenuOptionItem[] {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const transactionIds = getTransactionId(transactionDetails)

  const isHiddenActivity = useIsActivityHidden(transactionDetails.id)

  const onRampProviderName =
    transactionDetails.typeInfo.type === TransactionType.OnRampPurchase ||
    transactionDetails.typeInfo.type === TransactionType.OnRampTransfer ||
    transactionDetails.typeInfo.type === TransactionType.OffRampSale
      ? transactionDetails.typeInfo.serviceProvider.name
      : undefined

  const transactionActionItems: MenuOptionItem[] = useMemo(() => {
    const items: MenuOptionItem[] = []
    if (transactionIds && transactionIds.length > 0) {
      const { copyString = transactionIds.toString(), copyLabel } =
        transactionIds.length > 1
          ? {
              copyString: t('transaction.action.multipleHashes', { hashes: transactionIds.join(', ') }),
              copyLabel: t('transaction.action.copyPlural'),
            }
          : {
              copyString: transactionIds[0],
              copyLabel: onRampProviderName
                ? t('transaction.action.copyProvider', { providerName: onRampProviderName })
                : t('transaction.action.copy'),
            }

      items.push({
        label: copyLabel,
        Icon: CopySheets,
        onPress: async (): Promise<void> => {
          await setClipboard(copyString)
          dispatch(
            pushNotification({
              type: AppNotificationType.Copied,
              copyType: CopyNotificationType.TransactionId,
            }),
          )
          onCopySuccess?.()
        },
      })
    }

    items.push({
      label: t('settings.action.help'),
      Icon: HelpCenter,
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
        label: t('transaction.action.clear'),
        Icon: Clear,
        onPress: async (): Promise<void> => {
          dispatch(finalizeTransaction({ ...transactionDetails, status: TransactionStatus.Failed }))
        },
      })
    }

    if (isHiddenActivity) {
      items.push({
        label: t('reporting.activity.unhide.action'),
        Icon: Eye,
        onPress: async (): Promise<void> => {
          // Set visibility to true
          dispatch(setActivityVisibility({ transactionId: transactionDetails.id, isVisible: true }))

          // Show unhiding success
          onUnhideTransaction?.()
          dispatch(
            pushNotification({
              type: AppNotificationType.AssetVisibility,
              visible: false,
              hideDelay: 2 * ONE_SECOND_MS,
              assetName: t('common.activity'),
            }),
          )
        },
      })
    } else {
      items.push({
        label: t('nft.reportSpam'),
        Icon: Flag,
        destructive: true,
        onPress: showReportModal,
      })
    }

    return items
  }, [
    dispatch,
    onRampProviderName,
    t,
    transactionDetails,
    transactionIds,
    onUnhideTransaction,
    isHiddenActivity,
    showReportModal,
    onCopySuccess,
  ])

  return transactionActionItems
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
      params.append(SupportLinkParams.ReportType, isWebPlatform ? 'uniswap_extension_issue' : 'uw_ios_app') // Report Type Dropdown
      params.append(SupportLinkParams.IssueType, 'uw_transaction_details_page_submission') // Issue type Dropdown
      params.append(SupportLinkParams.TransactionId, transactionDetails.hash ?? 'N/A') // Transaction id
      return openUri({ uri: uniswapUrls.helpRequestUrl + '?' + params.toString() }).catch((e) =>
        logger.error(e, { tags: { file: 'TransactionActionsModal', function: 'getHelpLink' } }),
      )
  }
}

function getTransactionId(transactionDetails: TransactionDetails): string[] | undefined {
  switch (transactionDetails.typeInfo.type) {
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
      return [transactionDetails.typeInfo.id]
    case TransactionType.OffRampSale:
      return transactionDetails.typeInfo.providerTransactionId
        ? [transactionDetails.typeInfo.providerTransactionId]
        : undefined
    case TransactionType.Plan: {
      return (
        transactionDetails.typeInfo.transactionHashes ??
        transactionDetails.typeInfo.stepDetails.map((step) => step.hash).filter((hash) => hash !== undefined)
      )
    }
    default:
      return transactionDetails.hash ? [transactionDetails.hash] : undefined
  }
}
