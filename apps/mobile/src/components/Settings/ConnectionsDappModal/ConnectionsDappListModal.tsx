import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { BackButton } from 'src/components/buttons/BackButton'
import { ConnectedDappsList } from 'src/components/Requests/ConnectedDapps/ConnectedDappsList'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import ScanQRIcon from 'ui/src/assets/icons/scan.svg'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'

export function ConnectionsDappListModal(): JSX.Element {
  const dispatch = useDispatch()
  const { initialState } = useSelector(selectModalState(ModalName.ConnectionsDappListModal))
  const address = initialState?.address ?? ''
  const { sessions } = useWalletConnect(address)
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const colors = useSporeColorsForTheme()

  const onPressBottomToggle = (): void => {
    onClose()
    dispatch(removePendingSession())
    dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.ScanQr }))
  }

  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.ConnectionsDappListModal }))
  }

  return (
    <Modal fullScreen name={ModalName.ConnectionsDappListModal} onClose={onClose}>
      <ConnectedDappsList backButton={<BackButton onPressBack={onClose} />} sessions={sessions} />
      <Flex centered mb="$spacing12" mt="$spacing16" mx="$spacing16">
        <TouchableArea
          borderColor={isDarkMode ? '$transparent' : '$surface3'}
          borderRadius="$rounded24"
          borderWidth="$spacing1"
          p="$spacing16"
          paddingEnd="$spacing24"
          backgroundColor="$accent3"
          onPress={onPressBottomToggle}
        >
          <Flex row alignItems="center" gap="$spacing12">
            <ScanQRIcon color={colors.surface1.val} height={iconSizes.icon24} width={iconSizes.icon24} />

            <Text color={colors.surface1.val} variant="buttonLabel2">
              {t('qrScanner.recipient.action.scan')}
            </Text>
          </Flex>
        </TouchableArea>
      </Flex>
    </Modal>
  )
}
