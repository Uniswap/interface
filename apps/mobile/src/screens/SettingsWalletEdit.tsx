import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  KeyboardAvoidingView,
  TextInput as NativeTextInput,
  StyleSheet,
} from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { SettingsStackParamList } from 'src/app/navigation/types'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { UnitagBanner } from 'src/components/unitags/UnitagBanner'
import { Button, Flex, Icons, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { isIOS } from 'uniswap/src/utils/platform'
import { TextInput } from 'wallet/src/components/input/TextInput'
import { NICKNAME_MAX_LENGTH } from 'wallet/src/constants/accounts'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { useCanAddressClaimUnitag } from 'wallet/src/features/unitags/hooks'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useAccounts, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'
import { Screens } from './Screens'

type Props = NativeStackScreenProps<SettingsStackParamList, Screens.SettingsWalletEdit>

export function SettingsWalletEdit({
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const activeAccount = useAccounts()[address]
  const displayName = useDisplayName(address)
  const [nickname, setNickname] = useState(displayName?.name)
  const [showEditButton, setShowEditButton] = useState(true)
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const { canClaimUnitag } = useCanAddressClaimUnitag(address)
  const showUnitagBanner =
    unitagsFeatureFlagEnabled &&
    activeAccount?.type === AccountType.SignerMnemonic &&
    canClaimUnitag

  const accountNameIsEditable =
    displayName?.type === DisplayNameType.Local || displayName?.type === DisplayNameType.Address

  const inputRef = useRef<NativeTextInput>(null)

  const onEditButtonPress = (): void => {
    inputRef.current?.focus()
    setShowEditButton(false)
  }

  const onFinishEditing = (): void => {
    Keyboard.dismiss()
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
      })
    )
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        enabled
        behavior={isIOS ? 'padding' : undefined}
        contentContainerStyle={styles.expand}
        style={styles.base}>
        <BackHeader alignment="center" mx="$spacing16" pt="$spacing16">
          <Text variant="body1">{t('settings.setting.wallet.action.editLabel')}</Text>
        </BackHeader>
        <Flex
          grow
          gap="$spacing36"
          justifyContent="space-between"
          pb="$spacing16"
          pt="$spacing24"
          px="$spacing24">
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
              py="$spacing12">
              <TextInput
                ref={inputRef}
                autoCapitalize="none"
                color={accountNameIsEditable ? '$neutral1' : '$neutral2'}
                disabled={!accountNameIsEditable}
                fontFamily="$subHeading"
                fontSize={fonts.subheading1.fontSize}
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
                <Button
                  backgroundless
                  icon={<Icons.PenLine color="$neutral3" />}
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
            {showUnitagBanner && (
              <UnitagBanner compact address={address} entryPoint={Screens.Settings} />
            )}
          </Flex>
          <Button
            hapticFeedback
            disabled={nickname === displayName?.name}
            size="medium"
            theme="primary"
            onPress={onPressSaveChanges}>
            {t('settings.setting.wallet.editLabel.save')}
          </Button>
        </Flex>
      </KeyboardAvoidingView>
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
