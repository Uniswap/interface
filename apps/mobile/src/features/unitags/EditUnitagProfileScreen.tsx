import { useNavigation } from '@react-navigation/native'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Flex, Text } from 'ui/src'
import { Ellipsis } from 'ui/src/components/icons'
import { useBottomSheetSafeKeyboard } from 'uniswap/src/components/modals/useBottomSheetSafeKeyboard'
import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { isIOS } from 'utilities/src/platform'
import { ChangeUnitagModal } from 'wallet/src/features/unitags/ChangeUnitagModal'
import { DeleteUnitagModal } from 'wallet/src/features/unitags/DeleteUnitagModal'
import { EditUnitagProfileContent } from 'wallet/src/features/unitags/EditUnitagProfileContent'

export function EditUnitagProfileScreen({ route }: UnitagStackScreenProp<UnitagScreens.EditProfile>): JSX.Element {
  const { address, unitag, entryPoint } = route.params
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { keyboardHeight } = useBottomSheetSafeKeyboard()

  const [showDeleteUnitagModal, setShowDeleteUnitagModal] = useState(false)
  const [showChangeUnitagModal, setShowChangeUnitagModal] = useState(false)

  const onNavigate = (): void => {
    navigate(MobileScreens.Home)
  }

  const onBack = (): void => {
    navigation.goBack()
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

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={isIOS ? 'padding' : undefined}
        // Disable the keyboard avoiding view when the modals are open, otherwise background elements will shift up when the user is editing their username
        enabled={!showDeleteUnitagModal && !showChangeUnitagModal}
        style={styles.base}
      >
        <BackHeader
          alignment="center"
          endAdornment={
            // Only show options to delete and edit username if editing from settings
            entryPoint === MobileScreens.SettingsWallet ? (
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
            ) : undefined
          }
          p="$spacing16"
          onPressBack={
            // If entering from confirmation screen, back btn navigates to home
            entryPoint === UnitagScreens.UnitagConfirmation ? (): void => navigate(MobileScreens.Home) : undefined
          }
        >
          <Text variant="body1">{t('settings.setting.wallet.action.editProfile')}</Text>
        </BackHeader>
        <EditUnitagProfileContent address={address} unitag={unitag} entryPoint={entryPoint} onNavigate={onNavigate} />
      </KeyboardAvoidingView>
      {showDeleteUnitagModal && (
        <DeleteUnitagModal address={address} unitag={unitag} onSuccess={onBack} onClose={onCloseDeleteModal} />
      )}
      {showChangeUnitagModal && (
        <ChangeUnitagModal
          address={address}
          unitag={unitag}
          keyboardHeight={keyboardHeight}
          onSuccess={onBack}
          onClose={onCloseChangeModal}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})
