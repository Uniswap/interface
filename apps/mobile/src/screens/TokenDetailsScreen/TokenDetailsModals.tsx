import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ContractAddressExplainerModal } from 'src/components/TokenDetails/ContractAddressExplainerModal'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { useEvent } from 'utilities/src/react/hooks'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'

export const TokenDetailsModals = memo(function _TokenDetailsModals(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { navigateToSwapFlow } = useWalletNavigation()

  const {
    chainId,
    address,
    activeTransactionType,
    currencyInfo,
    isTokenWarningModalOpen,
    isContractAddressExplainerModalOpen,
    closeTokenWarningModal,
    closeContractAddressExplainerModal,
    copyAddressToClipboard,
  } = useTokenDetailsContext()

  const onAcknowledgeTokenWarning = useEvent(() => {
    closeTokenWarningModal()
    if (activeTransactionType !== undefined) {
      navigateToSwapFlow({ currencyField: activeTransactionType, currencyAddress: address, currencyChainId: chainId })
    }
  })

  const onAcknowledgeContractAddressExplainer = useEvent(async (markViewed: boolean) => {
    closeContractAddressExplainerModal(markViewed)
    if (markViewed) {
      await copyAddressToClipboard(address)
    }
  })

  const onTokenWarningReportSuccess = useEvent(() => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Success,
        title: t('common.reported'),
      }),
    )
  })

  return (
    <>
      {isTokenWarningModalOpen && currencyInfo && (
        <TokenWarningModal
          isInfoOnlyWarning
          currencyInfo0={currencyInfo}
          isVisible={isTokenWarningModalOpen}
          closeModalOnly={closeTokenWarningModal}
          onReportSuccess={onTokenWarningReportSuccess}
          onAcknowledge={onAcknowledgeTokenWarning}
        />
      )}

      {isContractAddressExplainerModalOpen && (
        <ContractAddressExplainerModal onAcknowledge={onAcknowledgeContractAddressExplainer} />
      )}
    </>
  )
})
