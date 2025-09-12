import { default as React, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { ScrollView } from 'react-native-gesture-handler'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { navigateBackFromEditingWallet } from 'src/components/Settings/EditWalletModal/EditWalletNavigation'
import { Flex, Text } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useBottomSheetSafeKeyboard } from 'uniswap/src/components/modals/useBottomSheetSafeKeyboard'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { ChangeUnitagModal } from 'wallet/src/features/unitags/ChangeUnitagModal'
import { DeleteUnitagModal } from 'wallet/src/features/unitags/DeleteUnitagModal'
import { EditUnitagProfileContent } from 'wallet/src/features/unitags/EditUnitagProfileContent'

export function EditProfileSettingsModal({
  route,
}: AppStackScreenProp<typeof ModalName.EditProfileSettingsModal>): JSX.Element {
  const { onClose } = useReactNavigationModal()
  const { address, accessPoint } = route.params
  const entryPoint = accessPoint ?? MobileScreens.SettingsWallet

  const { data: retrievedUnitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const unitag = retrievedUnitag?.username

  const { t } = useTranslation()
  const { keyboardHeight } = useBottomSheetSafeKeyboard()

  const [showDeleteUnitagModal, setShowDeleteUnitagModal] = useState(false)
  const [showChangeUnitagModal, setShowChangeUnitagModal] = useState(false)
  const [isUpdatingWalletProfile, setIsUpdatingWalletProfile] = useState(false)

  const onButtonClick = (): void => {
    setIsUpdatingWalletProfile(true)
  }

  const onNavigate = (): void => {
    navigate(MobileScreens.Home)
  }

  const onBack = (): void => {
    onClose()
  }

  const onCloseChangeModal = (): void => {
    setShowChangeUnitagModal(false)
  }

  const onCloseDeleteModal = (): void => {
    setShowDeleteUnitagModal(false)
  }

  const menuActions = useMemo(() => {
    return [
      { title: t('unitags.profile.action.edit'), systemIcon: 'pencil' },
      { title: t('unitags.profile.action.delete'), systemIcon: 'trash', destructive: true },
    ]
  }, [t])
  const onPressBack = (): void => {
    onClose()

    if (!isUpdatingWalletProfile) {
      navigateBackFromEditingWallet(entryPoint, address)
    }
  }

  return (
    <Modal fullScreen name={ModalName.EditProfileSettingsModal} onClose={onClose}>
      <BackHeader
        alignment="center"
        endAdornment={
          <ContextMenu
            dropdownMenuMode
            actions={menuActions}
            onPress={(e): void => {
              dismissNativeKeyboard()
              // Emitted index based on order of menu action array
              // Edit username
              if (e.nativeEvent.index === 0) {
                setShowChangeUnitagModal(true)
              }
              // Delete username
              if (e.nativeEvent.index === 1) {
                setShowDeleteUnitagModal(true)
              }
            }}
          >
            <Flex pr="$spacing8">
              <Ellipsis color="$neutral2" size="$icon.24" />
            </Flex>
          </ContextMenu>
        }
        p="$spacing16"
        onPressBack={onPressBack}
      >
        <Text variant="body1">{t('settings.setting.wallet.action.editProfile')}</Text>
      </BackHeader>
      <KeyboardAwareScrollView ScrollViewComponent={ScrollView} contentContainerStyle={styles.base}>
        {unitag && (
          <EditUnitagProfileContent
            address={address}
            unitag={unitag}
            entryPoint={entryPoint}
            onNavigate={onNavigate}
            onButtonClick={onButtonClick}
          />
        )}
      </KeyboardAwareScrollView>
      {showDeleteUnitagModal && unitag && (
        <DeleteUnitagModal address={address} unitag={unitag} onSuccess={onBack} onClose={onCloseDeleteModal} />
      )}
      {showChangeUnitagModal && unitag && (
        <ChangeUnitagModal
          address={address}
          unitag={unitag}
          keyboardHeight={keyboardHeight}
          onSuccess={onBack}
          onClose={onCloseChangeModal}
        />
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})
