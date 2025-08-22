import { SharedEventName } from '@uniswap/analytics-events'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SmartWalletModal } from 'wallet/src/components/smartWallet/modals/SmartWalletModal'
import { SmartWalletUnavailableModal } from 'wallet/src/components/smartWallet/modals/SmartWalletUnavailableModal'
import {
  SmartWalletDelegationAction,
  useSmartWalletDelegationStatus,
} from 'wallet/src/components/smartWallet/smartAccounts/hooks'
import {
  setHasDismissedSmartWalletHomeScreenNudge,
  setHasShownSmartWalletHomeScreenNudge,
} from 'wallet/src/features/behaviorHistory/slice'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useDisplayName, useHasSmartWalletConsent } from 'wallet/src/features/wallet/hooks'
import { setSmartWalletConsent } from 'wallet/src/features/wallet/slice'

interface SmartWalletUpgradeModalsProps {
  account: Account
  onEnableSmartWallet: (onComplete: () => void) => void
  video?: React.ReactNode
  isHomeScreenFocused?: boolean
}

export function SmartWalletUpgradeModals({
  account,
  onEnableSmartWallet,
  video,
  isHomeScreenFocused = true,
}: SmartWalletUpgradeModalsProps): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { status: delegationStatus } = useSmartWalletDelegationStatus({ isSmartWalletUpgradeModal: true })
  const hasSmartWalletConsent = useHasSmartWalletConsent()
  const [showModal, setShowModal] = useState(true)
  const selectedWalletDisplayName = useDisplayName(account.address, { includeUnitagSuffix: true })

  useEffect(() => {
    if (delegationStatus !== SmartWalletDelegationAction.None) {
      setShowModal(true)
    }
  }, [delegationStatus])

  // Track when home screen modal is shown to prevent immediate dapp nudges
  useEffect(() => {
    if (delegationStatus === SmartWalletDelegationAction.PromptUpgrade && showModal) {
      dispatch(setHasShownSmartWalletHomeScreenNudge({ walletAddress: account.address }))
    }
  }, [dispatch, delegationStatus, showModal, account.address])

  const handleSmartWalletDismiss = (): void => {
    dispatch(setHasDismissedSmartWalletHomeScreenNudge({ walletAddress: account.address, hasDismissed: true }))
    setShowModal(false)

    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: ElementName.SmartWalletNotNow })
  }

  const handleEnableSmartWalletClick = (): void => {
    onEnableSmartWallet(() => setShowModal(false))
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: ElementName.SmartWalletEnabled })
  }

  const isModalOpen = showModal && isHomeScreenFocused

  switch (delegationStatus) {
    case SmartWalletDelegationAction.None:
      return null
    case SmartWalletDelegationAction.ShowConflict:
      return (
        <SmartWalletUnavailableModal
          isOpen={isModalOpen}
          displayName={selectedWalletDisplayName?.name || account.address}
          onClose={() => {
            handleSmartWalletDismiss()
            if (hasSmartWalletConsent) {
              dispatch(setSmartWalletConsent({ address: account.address, smartWalletConsent: false }))
            }
          }}
        />
      )
    case SmartWalletDelegationAction.PromptUpgrade:
      return (
        <SmartWalletModal
          hideHandlebar
          isOpen={isModalOpen}
          video={video}
          title={t('delegation.upgradeModal.title')}
          subtext={t('delegation.upgradeModal.description')}
          primaryButtonText={t('delegation.upgradeModal.enableSmartWallet')}
          primaryButtonOnClick={handleEnableSmartWalletClick}
          secondaryButtonText={t('common.button.later')}
          secondaryButtonEmphasis="text-only"
          secondaryButtonOnClick={handleSmartWalletDismiss}
          learnMoreUrl={uniswapUrls.helpArticleUrls.smartWalletDelegation}
          modalName={ModalName.SmartWalletUpgradeModal}
          isDismissible={false}
          onClose={handleSmartWalletDismiss}
        />
      )
  }
}
