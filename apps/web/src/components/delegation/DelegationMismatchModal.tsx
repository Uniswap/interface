import { SharedEventName } from '@uniswap/analytics-events'
import { WalletAlertBadge } from 'components/Badge/WalletAlertBadge'
import { DialogV2 } from 'components/Dialog/DialogV2'
import { useWalletDisplay } from 'components/Web3Status/RecentlyConnectedModal'
import { useAccount } from 'hooks/useAccount'
import { useTheme } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Blocked } from 'ui/src/components/icons/Blocked'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send.web'
import { useEvent } from 'utilities/src/react/hooks'
import { useDisconnect } from 'wagmi'
interface DelegationMismatchModalProps {
  onClose: () => void
}

function DelegationMismatchModal({ onClose }: DelegationMismatchModalProps) {
  const { t } = useTranslation()
  const account = useAccount()
  const { displayName } = useWalletDisplay(account.address)
  const { disconnect } = useDisconnect()
  const theme = useTheme()

  const walletName = account.connector?.name ?? t('common.your.connected.wallet')
  const iconSrc = account.connector?.icon

  const FEATURES = [
    t('smartWallets.delegationMismatchModal.features.1ClickSwaps'),
    <>
      {t('smartWallets.delegationMismatchModal.features.gasFreeSwaps')}
      <span style={{ color: theme.neutral2 }}>{` (${t('uniswapx.label')})`}</span>
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

  return (
    <Trace logImpression modal={ModalName.DelegationMismatch}>
      <DialogV2
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
        primaryButtonText={t('common.button.disconnect')}
        primaryButtonOnClick={handleSwitchWallets}
        primaryButtonVariant="default"
        primaryButtonEmphasis="secondary"
        secondaryButtonText={t('common.button.continue')}
        secondaryButtonOnClick={handleContinue}
        secondaryButtonVariant="default"
        secondaryButtonEmphasis="primary"
        learnMoreUrl={uniswapUrls.helpArticleUrls.mismatchedImports}
        learnMoreTextColor="$accent1"
        learnMoreTextVariant="buttonLabel3"
        onClose={onClose}
        buttonContainerProps={{ flexDirection: 'row', gap: '$spacing12' }}
        textAlign="left"
      >
        <Flex flexDirection="column" alignItems="flex-start" width="100%" mt="$spacing12" gap="$spacing8">
          {FEATURES.map((feature, index) => (
            <Flex key={index} row alignItems="center" gap="$spacing4">
              <Blocked color="$neutral3" size={16} />
              <Text variant="body3" color="$neutral1">
                {feature}
              </Text>
            </Flex>
          ))}
        </Flex>
      </DialogV2>
    </Trace>
  )
}

export default DelegationMismatchModal
