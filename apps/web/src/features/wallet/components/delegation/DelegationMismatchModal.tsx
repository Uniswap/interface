import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, Text } from '@universe/mycelium'
import { Blocked } from '@universe/mycelium/icons/Blocked'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { WalletAlertBadge } from '~/components/Badge/WalletAlertBadge'
import { useAccount } from '~/connection/hooks/useAccount'
import { useDisconnect } from '~/connection/hooks/useDisconnect'
import { useWalletDisplay } from '~/features/wallet/components/Web3Status/RecentlyConnectedModal'

interface DelegationMismatchModalProps {
  onClose: () => void
}

export function DelegationMismatchModal({ onClose }: DelegationMismatchModalProps) {
  const { t } = useTranslation()
  const account = useAccount()
  const { displayName } = useWalletDisplay(account.address)
  const disconnect = useDisconnect()
  const colors = useSporeColors()

  const walletName = account.connector?.name ?? t('common.your.connected.wallet')
  const iconSrc = account.connector?.icon

  const FEATURES = [
    t('smartWallets.delegationMismatchModal.features.1ClickSwaps'),
    <>
      {t('smartWallets.delegationMismatchModal.features.gasFreeSwaps')}
      <span style={{ color: colors.neutral2.val }}>{` (${t('uniswapx.label')})`}</span>
    </>,
    t('smartWallets.delegationMismatchModal.features.limitOrders'),
  ]

  const handleTrackModalDismissed = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.Continue,
      modal: ModalName.DelegationMismatch,
    })
  })

  const handleTrackDisconnectButtonClicked = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.Disconnect,
      modal: ModalName.DelegationMismatch,
    })
  })

  const handleSwitchWallets = useEvent(() => {
    onClose()
    disconnect()
    handleTrackDisconnectButtonClicked()
  })

  const handleContinue = useEvent(() => {
    onClose()
    handleTrackModalDismissed()
  })

  const primaryButton = useMemo(
    () => ({
      text: t('common.button.disconnect'),
      onPress: handleSwitchWallets,
      variant: 'default' as const,
      emphasis: 'secondary' as const,
    }),
    [t, handleSwitchWallets],
  )

  const secondaryButton = useMemo(
    () => ({
      text: t('common.button.continue'),
      onPress: handleContinue,
      variant: 'default' as const,
      emphasis: 'primary' as const,
    }),
    [t, handleContinue],
  )

  return (
    <Trace logImpression modal={ModalName.DelegationMismatch}>
      <Dialog
        isOpen
        modalName={ModalName.DelegationMismatch}
        title={t('smartWallets.delegationMismatchModal.title')}
        subtext={
          <Text variant="body3" color="$neutral2" textAlign="left" pr="$spacing4">
            {t('smartWallets.delegationMismatchModal.description', {
              walletName,
              displayName,
            })}
          </Text>
        }
        icon={<WalletAlertBadge walletIcon={iconSrc} />}
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        learnMoreUrl={UniswapHelpUrls.articles.mismatchedImports}
        learnMoreTextColor="$accent1"
        learnMoreTextVariant="buttonLabel3"
        onClose={onClose}
        textAlign="left"
      >
        <Flex flexDirection="column" alignItems="flex-start" width="100%" gap="$spacing8">
          {FEATURES.map((feature, index) => (
            <Flex key={index} row alignItems="center" gap="$spacing8">
              <Blocked color="$neutral2" size={16} />
              <Text variant="body3" color="$neutral1">
                {feature}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Dialog>
    </Trace>
  )
}

export default DelegationMismatchModal
