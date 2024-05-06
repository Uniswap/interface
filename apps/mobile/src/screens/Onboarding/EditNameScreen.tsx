import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ActivityIndicator, TextInput as NativeTextInput, StyleSheet } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import Trace from 'src/components/Trace/Trace'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { AnimatePresence, Button, Flex, Icons, Text } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { isAndroid } from 'uniswap/src/utils/platform'
import { TextInput } from 'wallet/src/components/input/TextInput'
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
import { ElementName } from 'wallet/src/telemetry/constants'
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
          t('onboarding.wallet.defaultName', { number: pendingAccount.derivationIndex + 1 }) ||
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
          ? OnboardingScreens.WelcomeWallet
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
      subtitle={t('onboarding.editName.subtitle')}
      title={t('onboarding.editName.title')}>
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
          <Button testID={ElementName.Continue} onPress={onPressNext}>
            {t('onboarding.editName.button.create')}
          </Button>
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
  const textInputRef = useRef<NativeTextInput>(null)

  // we default it to `true` to avoid flickering of a pencil icon,
  // because CustomizationSection has `autoFocus=true`
  const [focused, setFocused] = useState(true)

  const focusInputWithKeyboard = (): void => {
    textInputRef.current?.focus()
  }
  const walletAddress = shortenAddress(address)

  return (
    <Flex
      centered
      $short={{
        gap: '$none',
      }}
      gap="$spacing24">
      <Flex centered gap="$spacing24" height={200} px="$spacing16" width="100%">
        <Flex
          borderColor="$surface3"
          borderRadius="$rounded16"
          borderWidth={1}
          py="$spacing12"
          width="100%">
          <Flex centered row>
            <TextInput
              ref={textInputRef}
              autoFocus
              fontSize={fonts.heading3.fontSize}
              maxFontSizeMultiplier={fonts.heading3.maxFontSizeMultiplier}
              maxLength={NICKNAME_MAX_LENGTH}
              placeholder={t('onboarding.editName.label')}
              placeholderTextColor="$neutral3"
              style={isAndroid ? styles.noHorizontalPadding : {}}
              testID={ElementName.WalletNameInput}
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
        </Flex>
        <Flex centered gap="$spacing4">
          <Text color="$neutral3" variant="body3">
            <Trans
              components={{ highlight: <Text color="$neutral3" variant="buttonLabel3" /> }}
              i18nKey="onboarding.editName.walletAddress"
              values={{ walletAddress }}
            />
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
