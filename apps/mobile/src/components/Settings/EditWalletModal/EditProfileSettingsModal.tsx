import { Action } from '@reduxjs/toolkit'
import { default as React, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { BackHeader } from 'src/components/layout/BackHeader'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { Flex, Text } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useBottomSheetSafeKeyboard } from 'uniswap/src/components/modals/useBottomSheetSafeKeyboard'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isIOS } from 'utilities/src/platform'
import { ChangeUnitagModal } from 'wallet/src/features/unitags/ChangeUnitagModal'
import { DeleteUnitagModal } from 'wallet/src/features/unitags/DeleteUnitagModal'
import { EditUnitagProfileContent } from 'wallet/src/features/unitags/EditUnitagProfileContent'

export function EditProfileSettingsModal(): JSX.Element {
  const { initialState } = useSelector(selectModalState(ModalName.EditProfileSettingsModal))
  const address = initialState?.address ?? ''

  const { unitag: retrievedUnitag } = useUnitagByAddress(address)
  const unitag = retrievedUnitag?.username

  const entryPoint = UnitagScreens.UnitagConfirmation
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { keyboardHeight } = useBottomSheetSafeKeyboard()

  const [showDeleteUnitagModal, setShowDeleteUnitagModal] = useState(false)
  const [showChangeUnitagModal, setShowChangeUnitagModal] = useState(false)

  const onNavigate = (): void => {
    navigate(MobileScreens.Home)
  }

  const onBack = (): void => {
    dispatch(closeModal({ name: ModalName.EditProfileSettingsModal }))
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
    dispatch(closeModal({ name: ModalName.EditProfileSettingsModal }))
  }

  return (
    <Modal
      fullScreen
      name={ModalName.EditProfileSettingsModal}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.EditProfileSettingsModal }))}
    >
      <KeyboardAvoidingView
        behavior={isIOS ? 'padding' : undefined}
        contentContainerStyle={styles.expand}
        // Disable the keyboard avoiding view when the modals are open, otherwise background elements will shift up when the user is editing their username
        enabled={!showDeleteUnitagModal && !showChangeUnitagModal}
        style={styles.base}
      >
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
                <Ellipsis color="$neutral2" size={iconSizes.icon24} />
              </Flex>
            </ContextMenu>
          }
          p="$spacing16"
          onPressBack={onPressBack}
        >
          <Text variant="body1">{t('settings.setting.wallet.action.editProfile')}</Text>
        </BackHeader>
        {unitag && (
          <EditUnitagProfileContent address={address} unitag={unitag} entryPoint={entryPoint} onNavigate={onNavigate} />
        )}
      </KeyboardAvoidingView>
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
  expand: {
    flexGrow: 1,
  },
})
