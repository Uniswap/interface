import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, TextInput as NativeTextInput, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { UnitagBanner } from 'src/components/unitags/UnitagBanner'
import { DeprecatedButton, Flex, Text } from 'ui/src'
import { PenLine } from 'ui/src/components/icons'
import { fonts } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isIOS } from 'utilities/src/platform'
import { NICKNAME_MAX_LENGTH } from 'wallet/src/constants/accounts'
import { useCanAddressClaimUnitag } from 'wallet/src/features/unitags/hooks'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useAccounts, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

type Props = NativeStackScreenProps<SettingsStackParamList, MobileScreens.SettingsWalletEdit>

export function SettingsWalletEdit({
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccount = useAccounts()[address]
  const displayName = useDisplayName(address)
  const [nickname, setNickname] = useState(displayName?.name)
  const [showEditButton, setShowEditButton] = useState(true)
  const { canClaimUnitag } = useCanAddressClaimUnitag(address)
  const showUnitagBanner = activeAccount?.type === AccountType.SignerMnemonic && canClaimUnitag

  const accountNameIsEditable =
    displayName?.type === DisplayNameType.Local || displayName?.type === DisplayNameType.Address

  const inputRef = useRef<NativeTextInput>(null)

  const onEditButtonPress = (): void => {
    inputRef.current?.focus()
    setShowEditButton(false)
  }

  const onFinishEditing = (): void => {
    dismissNativeKeyboard()
    setShowEditButton(true)
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

  return (
    <Screen>
      {/* This GestureDetector is used to consume all pan gestures and prevent
      keyboard from flickering (see https://github.com/Uniswap/universe/pull/8242) */}
      <GestureDetector gesture={Gesture.Pan()}>
        <KeyboardAvoidingView
          enabled
          behavior={isIOS ? 'padding' : undefined}
          contentContainerStyle={styles.expand}
          style={styles.base}
        >
          <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
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
                  color={accountNameIsEditable ? '$neutral1' : '$neutral2'}
                  disabled={!accountNameIsEditable}
                  fontFamily="$subHeading"
                  fontSize={fonts.subheading1.fontSize}
                  fontWeight="$book"
                  m="$none"
                  maxLength={NICKNAME_MAX_LENGTH}
                  numberOfLines={1}
                  placeholder={t('settings.setting.wallet.label')}
                  placeholderTextColor="$neutral3"
                  px="$none"
                  py="$spacing12"
                  returnKeyType="done"
                  value={nickname}
                  onBlur={onFinishEditing}
                  onChangeText={setNickname}
                  onFocus={onEditButtonPress}
                  onSubmitEditing={onFinishEditing}
                />
                {showEditButton && accountNameIsEditable && (
                  <DeprecatedButton
                    backgroundless
                    icon={<PenLine color="$neutral3" />}
                    m="$none"
                    size="medium"
                    onPress={onEditButtonPress}
                  />
                )}
              </Flex>
              {accountNameIsEditable && (
                <Flex px="$spacing8" py="$spacing12">
                  <Text color="$neutral3">{t('settings.setting.wallet.editLabel.description')}</Text>
                </Flex>
              )}
              {showUnitagBanner && <UnitagBanner compact address={address} entryPoint={MobileScreens.Settings} />}
            </Flex>
            <DeprecatedButton
              isDisabled={nickname === displayName?.name}
              size="medium"
              theme="primary"
              onPress={onPressSaveChanges}
            >
              {t('settings.setting.wallet.editLabel.save')}
            </DeprecatedButton>
          </Flex>
        </KeyboardAvoidingView>
      </GestureDetector>
    </Screen>
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
