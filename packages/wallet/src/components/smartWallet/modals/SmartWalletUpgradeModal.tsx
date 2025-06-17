import { SharedEventName } from '@uniswap/analytics-events'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Image } from 'ui/src'
import { SMART_WALLET_UPGRADE_FALLBACK } from 'ui/src/assets'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SmartWalletUnavailableModal } from 'wallet/src/components/smartWallet/modals/SmartWalletUnavailableModal'
import {
  SmartWalletDelegationAction,
  useSmartWalletDelegationStatus,
} from 'wallet/src/components/smartWallet/smartAccounts/hook'
import { setHasDismissedSmartWalletHomeScreenNudge } from 'wallet/src/features/behaviorHistory/slice'
import { SmartWalletModal } from 'wallet/src/features/smartWallet/modals/SmartWalletModal'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

const IMAGE_FALLBACK_HEIGHT = 200

interface SmartWalletUpgradeModalsProps {
  account: Account
  onEnableSmartWallet: (onComplete: () => void) => void
  video?: React.ReactNode
}

export function SmartWalletUpgradeModals({
  account,
  onEnableSmartWallet,
  video,
}: SmartWalletUpgradeModalsProps): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { status: delegationStatus } = useSmartWalletDelegationStatus({ isSmartWalletUpgradeModal: true })
  const [showModal, setShowModal] = useState(true)
  const selectedWalletDisplayName = useDisplayName(account.address, { includeUnitagSuffix: true })

  useEffect(() => {
    if (delegationStatus !== SmartWalletDelegationAction.None) {
      setShowModal(true)
    }
  }, [delegationStatus])

  const handleSmartWalletDismiss = (): void => {
    dispatch(setHasDismissedSmartWalletHomeScreenNudge({ walletAddress: account.address, hasDismissed: true }))
    setShowModal(false)

    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: ElementName.SmartWalletNotNow })
  }

  const handleEnableSmartWalletClick = (): void => {
    onEnableSmartWallet(() => setShowModal(false))
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: ElementName.SmartWalletEnabled })
  }

  switch (delegationStatus) {
    case SmartWalletDelegationAction.None:
      return null
    case SmartWalletDelegationAction.ShowConflict:
      return (
        <SmartWalletUnavailableModal
          isOpen={showModal}
          displayName={selectedWalletDisplayName?.name || account.address}
          onClose={() => {
            handleSmartWalletDismiss()
          }}
        />
      )
    case SmartWalletDelegationAction.PromptUpgrade:
      return (
        <SmartWalletModal
          hideHandlebar
          isOpen={showModal}
          video={video}
          icon={
            <Flex width="100%" borderRadius="$rounded12" overflow="hidden">
              <Image height={IMAGE_FALLBACK_HEIGHT} source={SMART_WALLET_UPGRADE_FALLBACK} maxWidth="100%" />
            </Flex>
          }
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
