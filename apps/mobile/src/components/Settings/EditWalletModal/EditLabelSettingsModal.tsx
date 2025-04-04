import { Action } from '@reduxjs/toolkit'
import { default as React, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, TextInput as NativeTextInput, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { BackHeader } from 'src/components/layout/BackHeader'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { Button, Flex, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isIOS } from 'utilities/src/platform'
import { NICKNAME_MAX_LENGTH } from 'wallet/src/constants/accounts'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

export function EditLabelSettingsModal(): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { initialState } = useSelector(selectModalState(ModalName.EditLabelSettingsModal))
  const address = initialState?.address ?? ''

  const displayName = useDisplayName(address)
  const [nickname, setNickname] = useState(displayName?.name)

  const accountNameIsEditable =
    displayName?.type === DisplayNameType.Local || displayName?.type === DisplayNameType.Address

  const inputRef = useRef<NativeTextInput>(null)

  const onFinishEditing = (): void => {
    dismissNativeKeyboard()

    setNickname(nickname?.trim())
  }

  const onPressSaveChanges = (): void => {
    onFinishEditing()
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address,
        newName: nickname?.trim() ?? '',
      }),
    )
  }

  const onPressBack = (): void => {
    dispatch(closeModal({ name: ModalName.EditLabelSettingsModal }))
  }

  return (
    <Modal
      fullScreen
      name={ModalName.EditLabelSettingsModal}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.EditLabelSettingsModal }))}
    >
      {/* This GestureDetector is used to consume all pan gestures and prevent
           keyboard from flickering (see https://github.com/Uniswap/universe/pull/8242) */}
      <GestureDetector gesture={Gesture.Pan()}>
        <KeyboardAvoidingView
          enabled
          behavior={isIOS ? 'padding' : undefined}
          contentContainerStyle={styles.expand}
          style={styles.base}
        >
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
                  color="$neutral2"
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
                  placeholder={sanitizeAddressText(shortenAddress(address, 6)) ?? t('settings.setting.wallet.label')}
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
            <Flex row alignSelf="stretch">
              <Button emphasis="primary" variant="branded" onPress={onPressSaveChanges}>
                {t('settings.setting.wallet.editLabel.save')}
              </Button>
            </Flex>
          </Flex>
        </KeyboardAvoidingView>
      </GestureDetector>
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
