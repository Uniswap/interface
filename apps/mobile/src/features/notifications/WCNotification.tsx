import React from 'react'
import { useDispatch } from 'react-redux'
import { openModal } from 'src/features/modals/modalSlice'
import { iconSizes } from 'ui/src/theme'
import { DappLogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { NOTIFICATION_ICON_SIZE } from 'uniswap/src/features/notifications/constants'
import { WalletConnectNotification } from 'uniswap/src/features/notifications/slice/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { formWCNotificationTitle } from 'wallet/src/features/notifications/utils'

export function WCNotification({ notification }: { notification: WalletConnectNotification }): JSX.Element {
  const { imageUrl, chainId, address, event, hideDelay, dappName } = notification
  const dispatch = useDispatch()
  const validChainId = toSupportedChainId(chainId)
  const title = formWCNotificationTitle(notification)

  const smallToastEvents = [
    WalletConnectEvent.Connected,
    WalletConnectEvent.Disconnected,
    WalletConnectEvent.NetworkChanged,
  ]
  const smallToast = smallToastEvents.includes(event)

  const icon = (
    <DappLogoWithTxStatus
      chainId={validChainId}
      dappImageUrl={imageUrl}
      dappName={dappName}
      event={event}
      size={smallToast ? iconSizes.icon24 : NOTIFICATION_ICON_SIZE}
    />
  )

  const onPressNotification = (): void => {
    dispatch(
      openModal({
        name: ModalName.WalletConnectScan,
        initialState: ScannerModalState.ConnectedDapps,
      }),
    )
  }

  return (
    <NotificationToast
      address={address}
      hideDelay={hideDelay}
      icon={icon}
      smallToast={smallToast}
      title={title}
      onPress={onPressNotification}
    />
  )
}
