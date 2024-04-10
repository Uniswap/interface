import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { TransferInstitutionSelector } from 'src/features/fiatOnRamp/FiatOnRampTransferInstitutionSelector'
import { FOR_MODAL_SNAP_POINTS } from 'src/features/fiatOnRamp/constants'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { Flex, Icons, Separator, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'
import { ModalName } from 'wallet/src/telemetry/constants'
import { setClipboard } from 'wallet/src/utils/clipboard'

const ACCOUNT_IMAGE_SIZE = 52
const ICON_SIZE = 32
const ICON_BORDER_RADIUS = 100

function AccountCardItem({ onClose }: { onClose: () => void }): JSX.Element {
  const dispatch = useAppDispatch()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const onPressCopyAddress = async (): Promise<void> => {
    await impactAsync()
    await setClipboard(activeAccountAddress)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      })
    )
  }

  const onPressShowWalletQr = (): void => {
    onClose()
    dispatch(
      openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
    )
  }

  return (
    <TouchableArea
      hapticFeedback
      hapticStyle={ImpactFeedbackStyle.Light}
      onPress={onPressShowWalletQr}>
      <Flex row alignItems="flex-start" gap="$spacing12" px="$spacing8">
        <Flex
          fill
          row
          borderColor="$surface3"
          borderRadius="$rounded20"
          borderWidth="$spacing1"
          gap="$spacing12"
          p="$spacing12">
          <Flex fill>
            <AddressDisplay
              address={activeAccountAddress}
              captionVariant="body3"
              gapBetweenLines="$spacing2"
              size={ACCOUNT_IMAGE_SIZE}
            />
          </Flex>
          <Flex centered row gap="$spacing12" px="$spacing8">
            <TouchableArea
              hapticFeedback
              hapticStyle={ImpactFeedbackStyle.Light}
              onPress={onPressCopyAddress}>
              <Flex
                centered
                row
                backgroundColor="$surface3"
                borderRadius={ICON_BORDER_RADIUS}
                height={ICON_SIZE}
                width={ICON_SIZE}>
                <Icons.CopySheets color="$neutral2" size={iconSizes.icon16} />
              </Flex>
            </TouchableArea>
            <Flex
              centered
              row
              backgroundColor="$surface3"
              borderRadius={ICON_BORDER_RADIUS}
              height={ICON_SIZE}
              width={ICON_SIZE}>
              <Icons.QrCode color="$neutral2" size={iconSizes.icon16} />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

export function ReceiveCryptoModal(): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.ReceiveCryptoModal }))
  }

  return (
    <BottomSheetModal
      extendOnKeyboardVisible
      fullScreen
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      backgroundColor={colors.surface1.get()}
      name={ModalName.ReceiveCryptoModal}
      snapPoints={FOR_MODAL_SNAP_POINTS}
      onClose={onClose}>
      <Flex grow gap="$spacing12" px="$spacing16">
        <Flex gap="$spacing4" p="$spacing8">
          <Text color="$neutral1" mt="$spacing2" textAlign="center" variant="subheading1">
            {t('home.upsell.receive.title')}
          </Text>
          <Text color="$neutral2" mt="$spacing2" textAlign="center" variant="body3">
            {t('home.upsell.receive.description')}
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
        <TransferInstitutionSelector onClose={onClose} />
      </Flex>
    </BottomSheetModal>
  )
}
