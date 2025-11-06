import { WalletAlertBadge } from 'components/Badge/WalletAlertBadge'
import { Toast } from 'components/Popups/Toast'
import { useAccount } from 'hooks/useAccount'
import { useModalState } from 'hooks/useModalState'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'

export const MismatchToastItem = React.memo((props: { onDismiss: () => void }): JSX.Element => {
  const { t } = useTranslation()
  const { openModal } = useModalState(ModalName.DelegationMismatch)
  const { chainId } = useAccount()

  const onDismiss = useEvent(() => {
    sendAnalyticsEvent(InterfaceEventName.LimitedWalletSupportToastDismissed, { chainId: chainId?.valueOf() })
    props.onDismiss()
  })

  const onPress = useEvent(() => {
    // track when the user clicks the learn more button
    sendAnalyticsEvent(InterfaceEventName.LimitedWalletSupportToastLearnMoreButtonClicked, {
      chainId: chainId?.valueOf(),
    })
    openModal()
    props.onDismiss()
  })

  return (
    <Trace logImpression eventOnTrigger={InterfaceEventName.LimitedWalletSupportToastShown}>
      <Toast onPress={onPress}>
        <Toast.Icon>
          <WalletIcon />
        </Toast.Icon>
        <Toast.Content>
          <Flex row alignItems="center" justifyContent="space-between">
            <Toast.Title>{t('wallet.mismatch.popup.title')}</Toast.Title>
            <Toast.Close onPress={onDismiss} />
          </Flex>
          <Toast.Description>{t('wallet.mismatch.popup.description')}</Toast.Description>
          <Toast.Action onPress={onPress}>{t('common.button.viewDetails')}</Toast.Action>
        </Toast.Content>
      </Toast>
    </Trace>
  )
})

MismatchToastItem.displayName = 'MismatchToastItem'

const WalletIcon = React.memo(() => {
  const account = useAccount()
  const iconSrc = account.connector?.icon
  return <WalletAlertBadge walletIconSize={spacing.spacing32} walletIcon={iconSrc} />
})

WalletIcon.displayName = 'WalletIcon'
