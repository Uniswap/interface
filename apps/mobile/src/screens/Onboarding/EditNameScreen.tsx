import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, TextInput as NativeTextInput } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { TextInput } from 'src/components/input/TextInput'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID } from 'src/constants/globals'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { AnimatePresence, Button, Flex, Icons, Text, useMedia } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { NICKNAME_MAX_LENGTH } from 'wallet/src/constants/accounts'
import { ImportType } from 'wallet/src/features/onboarding/types'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.EditName>

export function EditNameScreen({ navigation, route: { params } }: Props): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  // Reference pending accounts to avoid any lag in saga import.
  const pendingAccount = Object.values(usePendingAccounts())?.[0]

  useEffect(() => {
    // Sets the default wallet nickname based on derivation index once the pendingAccount is set.
    if (pendingAccount && pendingAccount.type !== AccountType.Readonly) {
      setNewAccountName(
        pendingAccount.name ||
          t('Wallet {{ number }}', { number: pendingAccount.derivationIndex + 1 }) ||
          ''
      )
    }
  }, [pendingAccount, t])

  const [newAccountName, setNewAccountName] = useState<string>('')

  useAddBackButton(navigation)

  useEffect(() => {
    const beforeRemoveListener = (): void => {
      dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
    }
    navigation.addListener('beforeRemove', beforeRemoveListener)

    return () => navigation.removeListener('beforeRemove', beforeRemoveListener)
  }, [dispatch, navigation])

  const onPressNext = (): void => {
    navigation.navigate({
      name:
        params?.importType === ImportType.CreateNew
          ? OnboardingScreens.QRAnimation
          : OnboardingScreens.Notifications,
      merge: true,
      params,
    })

    if (pendingAccount) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.Rename,
          address: pendingAccount?.address,
          newName: newAccountName.trim(),
        })
      )
    }
  }

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t('This nickname is only visible to you')}
      title={t('Give your wallet a nickname')}>
      {pendingAccount ? (
        <CustomizationSection
          accountName={newAccountName}
          address={pendingAccount?.address}
          setAccountName={setNewAccountName}
        />
      ) : (
        <ActivityIndicator />
      )}
      <Flex justifyContent="flex-end">
        <Trace logPress element={ElementName.Continue}>
          <Button onPress={onPressNext}>{t('Create wallet')}</Button>
        </Trace>
      </Flex>
    </SafeKeyboardOnboardingScreen>
  )
}

function CustomizationSection({
  address,
  accountName,
  setAccountName,
}: {
  address: Address
  accountName: string
  setAccountName: Dispatch<SetStateAction<string>>
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const textInputRef = useRef<NativeTextInput>(null)

  // we default it to `true` to avoid flickering of a pencil icon,
  // because CustomizationSection has `autoFocus=true`
  const [focused, setFocused] = useState(true)

  const focusInputWithKeyboard = (): void => {
    textInputRef.current?.focus()
  }

  const inputSize = media.short ? fonts.heading3.fontSize : fonts.heading2.fontSize

  return (
    <Flex
      centered
      $short={{
        gap: '$none',
      }}
      gap="$spacing24">
      <Flex centered gap="$spacing24" h={200} width="100%">
        <Flex centered row>
          <TextInput
            ref={textInputRef}
            autoFocus
            fontSize={inputSize}
            maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
            maxLength={NICKNAME_MAX_LENGTH}
            placeholder={t('Nickname')}
            placeholderTextColor="$neutral3"
            style={IS_ANDROID ? styles.noHorizontalPadding : {}}
            testID="customize/name"
            textAlign="center"
            value={accountName}
            onBlur={(): void => {
              setFocused(false)
              setAccountName(accountName.trim())
            }}
            onChangeText={setAccountName}
            onFocus={(): void => setFocused(true)}
          />
          <AnimatePresence>
            {!focused && (
              <Button
                fadeIn
                fadeOut
                animation="lazy"
                icon={<Icons.Pencil color="$neutral2" />}
                theme="secondary"
                onPress={focusInputWithKeyboard}
              />
            )}
          </AnimatePresence>
        </Flex>
        <Flex centered gap="$spacing4">
          <Text color="$neutral3" variant="body3">
            {t('Your public address will be')}
          </Text>
          <Text color="$neutral3" variant="buttonLabel3">
            {shortenAddress(address)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

const styles = StyleSheet.create({
  noHorizontalPadding: {
    paddingHorizontal: 0,
  },
})
