import { SharedEventName } from '@uniswap/analytics-events'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { ServiceProviderSelector } from 'src/features/fiatOnRamp/ExchangeTransferServiceProviderSelector'
import { openModal } from 'src/features/modals/modalSlice'
import { Flex, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import { CopySheets, QrCode } from 'ui/src/components/icons'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const ACCOUNT_IMAGE_SIZE = 52
const ICON_SIZE = 32
const ICON_BORDER_RADIUS = 100

function AccountCardItem({ onClose }: { onClose: () => void }): JSX.Element {
  const dispatch = useDispatch()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const onPressCopyAddress = async (): Promise<void> => {
    await setClipboard(activeAccountAddress)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CopyAddress,
      modal: ModalName.ReceiveCryptoModal,
    })
  }

  const onPressShowWalletQr = (): void => {
    onClose()
    dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }))
  }

  return (
    <TouchableArea onPress={onPressShowWalletQr}>
      <Flex row alignItems="flex-start" gap="$spacing12" px="$spacing8">
        <Flex
          fill
          row
          borderColor="$surface3"
          borderRadius="$rounded20"
          borderWidth="$spacing1"
          gap="$spacing12"
          p="$spacing12"
        >
          <Flex fill>
            <AddressDisplay
              address={activeAccountAddress}
              captionVariant="body3"
              gapBetweenLines="$spacing2"
              size={ACCOUNT_IMAGE_SIZE}
            />
          </Flex>
          <Flex centered row gap="$spacing12" px="$spacing8">
            <TouchableArea onPress={onPressCopyAddress}>
              <Flex
                centered
                row
                backgroundColor="$surface3"
                borderRadius={ICON_BORDER_RADIUS}
                height={ICON_SIZE}
                width={ICON_SIZE}
              >
                <CopySheets color="$neutral2" size="$icon.16" />
              </Flex>
            </TouchableArea>
            <Flex
              centered
              row
              backgroundColor="$surface3"
              borderRadius={ICON_BORDER_RADIUS}
              height={ICON_SIZE}
              width={ICON_SIZE}
            >
              <QrCode color="$neutral2" size="$icon.16" />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export function ReceiveCryptoModal({ route }: AppStackScreenProp<typeof ModalName.ReceiveCryptoModal>): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { serviceProviders } = route.params
  const { onClose } = useReactNavigationModal()

  return (
    <Modal
      extendOnKeyboardVisible
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      backgroundColor={colors.surface1.val}
      name={ModalName.ReceiveCryptoModal}
      onClose={onClose}
    >
      <Flex grow gap="$spacing12" mb="$spacing16" px="$spacing16">
        <Flex gap="$spacing4" p="$spacing8">
          <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
            {t('home.upsell.receive.title')}
          </Text>
          <Text color="$neutral2" mt="$spacing2" textAlign="center" variant="body3">
            {t('fiatOnRamp.receiveCrypto.transferFunds')}
          </Text>
        </Flex>
        <AccountCardItem onClose={onClose} />
        <Flex centered row shrink gap="$spacing12" py="$spacing8">
          <Separator />
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('home.upsell.receive.cta')}
          </Text>
          <Separator />
        </Flex>
        <ServiceProviderSelector serviceProviders={serviceProviders} onClose={onClose} />
      </Flex>
    </Modal>
  )
}
