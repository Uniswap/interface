import { default as React, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput as NativeTextInput, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { useDispatch } from 'react-redux'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { navigateBackFromEditingWallet } from 'src/components/Settings/EditWalletModal/EditWalletNavigation'
import { Button, Flex, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { NICKNAME_MAX_LENGTH } from 'wallet/src/constants/accounts'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

export function EditLabelSettingsModal({
  route,
}: AppStackScreenProp<typeof ModalName.EditLabelSettingsModal>): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { onClose } = useReactNavigationModal()

  const { address, accessPoint } = route.params
  const entryPoint = accessPoint ?? MobileScreens.SettingsWallet

  const displayName = useDisplayName(address)
  const [nickname, setNickname] = useState(displayName?.type === DisplayNameType.Local ? displayName.name : '')
  const [isUpdatingWalletLabel, setIsUpdatingWalletLabel] = useState(false)

  const accountNameIsEditable =
    displayName?.type === DisplayNameType.Local || displayName?.type === DisplayNameType.Address

  const inputRef = useRef<NativeTextInput>(null)

  const onFinishEditing = (): void => {
    dismissNativeKeyboard()

    setNickname(nickname.trim())
  }

  const onPressSaveChanges = (): void => {
    setIsUpdatingWalletLabel(true)
    onFinishEditing()
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address,
        newName: nickname.trim(),
      }),
    )
    onPressBack()
  }

  const onPressBack = (): void => {
    onClose()
    if (!isUpdatingWalletLabel) {
      navigateBackFromEditingWallet(entryPoint, address)
    }
  }

  return (
    <Modal fullScreen name={ModalName.EditLabelSettingsModal} onClose={onClose}>
      {/* This GestureDetector is used to consume all pan gestures and prevent
           keyboard from flickering (see https://github.com/Uniswap/universe/pull/8242) */}
      <GestureDetector gesture={Gesture.Pan()}>
        <Flex style={styles.base}>
          <BackHeader alignment="center" mx="$spacing16" pt="$spacing16" onPressBack={onPressBack}>
            <Text variant="body1">{t('settings.setting.wallet.action.editLabel')}</Text>
          </BackHeader>
          <Flex grow gap="$spacing36" justifyContent="space-between" pb="$spacing16" pt="$spacing24" px="$spacing24">
            <Flex>
              <Flex
                grow
                row
                alignItems="center"
                borderColor="$surface3"
                borderRadius="$rounded16"
                borderWidth="$spacing1"
                justifyContent="space-between"
                px="$spacing24"
                py="$spacing12"
              >
                <TextInput
                  ref={inputRef}
                  autoCapitalize="none"
                  color="$neutral1"
                  disabled={!accountNameIsEditable}
                  fontFamily="$subHeading"
                  fontSize={fonts.subheading1.fontSize}
                  fontWeight="$book"
                  m="$none"
                  maxLength={NICKNAME_MAX_LENGTH}
                  numberOfLines={1}
                  placeholderTextColor="$neutral3"
                  px="$none"
                  py="$spacing12"
                  returnKeyType="done"
                  value={nickname}
                  placeholder={
                    sanitizeAddressText(shortenAddress({ address, chars: 6 })) ?? t('settings.setting.wallet.label')
                  }
                  onBlur={onFinishEditing}
                  onChangeText={setNickname}
                  onSubmitEditing={onFinishEditing}
                />
              </Flex>
              {accountNameIsEditable && (
                <Flex px="$spacing8" py="$spacing12">
                  <Text color="$neutral2">{t('settings.setting.wallet.editLabel.description')}</Text>
                </Flex>
              )}
            </Flex>
            <KeyboardStickyView>
              <Flex row alignSelf="stretch">
                <Button emphasis="primary" variant="branded" onPress={onPressSaveChanges}>
                  {t('settings.setting.wallet.editLabel.save')}
                </Button>
              </Flex>
            </KeyboardStickyView>
          </Flex>
        </Flex>
      </GestureDetector>
    </Modal>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})
