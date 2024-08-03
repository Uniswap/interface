import { SharedEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { IconProps, MenuContentItem, getTokenValue, isWeb, useIsDarkMode } from 'ui/src'
import { CopySheets, HelpCenter } from 'ui/src/components/icons'
import { UNIVERSE_CHAIN_LOGO } from 'uniswap/src/assets/chainLogos'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyId } from 'uniswap/src/types/currency'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { AuthTrigger } from 'wallet/src/features/auth/types'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { isSwapTransactionInfo } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'
import { CancelConfirmationView } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/CancelConfirmationView'
import TransactionActionsModal, {
  getTransactionId,
  openSupportLink,
} from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionActionsModal'
import { cancelTransaction } from 'wallet/src/features/transactions/slice'
import {
  BaseSwapTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { getIsCancelable } from 'wallet/src/features/transactions/utils'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { openMoonpayTransactionLink, openTransactionLink } from 'wallet/src/utils/linking'

export const useTransactionActions = ({
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
  openCancelModal: () => void
  menuItems: MenuContentItem[]
} => {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const { navigateToTokenDetails } = useWalletNavigation()

  const { type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const dispatch = useDispatch()

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

  const handleExplore = useCallback((): Promise<void> => {
    setShowActionsModal(false)
    return openTransactionLink(hash, chainId)
  }, [chainId, hash])

  const handleViewMoonpay = (): Promise<void> | undefined => {
    if (transaction.typeInfo.type === TransactionType.FiatPurchase) {
      setShowActionsModal(false)
      return openMoonpayTransactionLink(transaction.typeInfo)
    }
    return undefined
  }

  const handleViewTokenDetails = useCallback(
    (currencyId: CurrencyId): void | undefined => {
      if (typeInfo.type === TransactionType.Swap) {
        setShowActionsModal(false)
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          element: ElementName.TokenItem,
          modal: ModalName.TransactionDetails,
        })

        navigateToTokenDetails(currencyId)
        if (!isWeb) {
          onNavigateAway?.()
        }
      }
      return undefined
    },
    [navigateToTokenDetails, onNavigateAway, typeInfo.type],
  )

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

  const chainInfo = UNIVERSE_CHAIN_INFO[chainId]
  const chainLogo = UNIVERSE_CHAIN_LOGO[chainId].explorer

  const isSwapTransaction = isSwapTransactionInfo(typeInfo)
  const inputCurrencyInfo = useCurrencyInfo((typeInfo as BaseSwapTransactionInfo).inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo((typeInfo as BaseSwapTransactionInfo).outputCurrencyId)

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

    if (isSwapTransaction && inputCurrencyInfo && outputCurrencyInfo) {
      const InputCurrencyLogo = ({ size }: IconProps): JSX.Element => (
        <CurrencyLogo
          currencyInfo={inputCurrencyInfo}
          size={!size || typeof size === 'number' ? size : getTokenValue(size)}
        />
      )
      const OutputCurrencyLogo = ({ size }: IconProps): JSX.Element => (
        <CurrencyLogo
          currencyInfo={outputCurrencyInfo}
          size={!size || typeof size === 'number' ? size : getTokenValue(size)}
        />
      )

      items.push({
        label: t('transaction.action.view', {
          tokenSymbol: inputCurrencyInfo?.currency.symbol,
        }),
        textProps: { variant: 'body2' },
        onPress: (): void => handleViewTokenDetails(inputCurrencyInfo.currencyId),
        Icon: InputCurrencyLogo,
      })

      items.push({
        label: t('transaction.action.view', {
          tokenSymbol: outputCurrencyInfo?.currency.symbol,
        }),
        textProps: { variant: 'body2' },
        onPress: (): void => handleViewTokenDetails(outputCurrencyInfo.currencyId),
        Icon: OutputCurrencyLogo,
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
    isSwapTransaction,
    inputCurrencyInfo,
    outputCurrencyInfo,
    transaction,
    t,
    chainInfo.explorer.name,
    handleExplore,
    isDarkMode,
    chainLogo.logoDark,
    chainLogo.logoLight,
    handleViewTokenDetails,
    dispatch,
  ])

  return {
    openActionsModal,
    openCancelModal,
    renderModals,
    menuItems,
  }
}
