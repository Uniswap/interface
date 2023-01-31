import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, TextInput as NativeTextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import PencilIcon from 'src/assets/icons/pencil-detailed.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { AnimatedButton, Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { NICKNAME_MAX_LENGTH } from 'src/constants/accounts'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { AccountType } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { usePendingAccounts } from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.EditName>

const renderHeaderLeft = (): JSX.Element => <BackButton />

export function EditNameScreen({ navigation, route: { params } }: Props): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  // Reference pending accounts to avoid any lag in saga import.
  const pendingAccount = Object.values(usePendingAccounts())?.[0]

  // To track the first time a default name is set. After this is true it shouldn't be set again
  const [hasDefaultName, setHasDefaultName] = useState(false)
  const [newAccountName, setNewAccountName] = useState<string>('')
  const [focused, setFocused] = useState(false)

  // Sets the default wallet nickname based on derivation index once the pendingAccount is set.
  useEffect(() => {
    if (hasDefaultName || !pendingAccount || pendingAccount.type === AccountType.Readonly) {
      return
    }

    const derivationIndex = pendingAccount.derivationIndex
    const defaultName =
      pendingAccount.name || t('Wallet {{ number }}', { number: derivationIndex + 1 })
    setNewAccountName(defaultName)
    setHasDefaultName(true)
  }, [pendingAccount, hasDefaultName, t])

  useEffect(() => {
    const beforeRemoveListener = (): void => {
      dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    }
    navigation.addListener('beforeRemove', beforeRemoveListener)

    const shouldRenderBackButton = navigation.getState().index === 0
    if (shouldRenderBackButton) {
      navigation.setOptions({
        headerLeft: renderHeaderLeft,
      })
    }
    return () => navigation.removeListener('beforeRemove', beforeRemoveListener)
  }, [dispatch, navigation])

  const onPressNext = (): void => {
    navigation.navigate({
      name:
        params?.importType === ImportType.CreateNew
          ? OnboardingScreens.Backup
          : OnboardingScreens.Notifications,
      merge: true,
      params,
    })

    if (pendingAccount) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.Rename,
          address: pendingAccount?.address,
          newName: newAccountName,
        })
      )
    }
  }

  return (
    <OnboardingScreen
      subtitle={t(
        'It has a public address that starts with 0x but you can set a private nickname to remember it by'
      )}
      title={t('Say hello to your new wallet')}>
      <Box paddingTop="xl">
        {pendingAccount ? (
          <CustomizationSection
            accountName={newAccountName}
            address={pendingAccount?.address}
            focused={focused}
            setAccountName={setNewAccountName}
            setFocused={setFocused}
          />
        ) : (
          <ActivityIndicator />
        )}
      </Box>
      <Flex justifyContent="flex-end">
        <Button label={t('Continue')} name={ElementName.Next} onPress={onPressNext} />
      </Flex>
    </OnboardingScreen>
  )
}

function CustomizationSection({
  address,
  accountName,
  setAccountName,
  focused,
  setFocused,
}: {
  address: Address
  accountName: string
  setAccountName: Dispatch<SetStateAction<string>>
  focused: boolean
  setFocused: Dispatch<SetStateAction<boolean>>
}): JSX.Element {
  const theme = useAppTheme()
  const textInputRef = useRef<NativeTextInput>(null)

  const focusInputWithKeyboard = (): void => {
    textInputRef.current?.focus()
  }

  return (
    <Flex centered gap="lg">
      <Flex centered gap="none" width="100%">
        <Flex centered row gap="none">
          <TextInput
            ref={textInputRef}
            autoFocus
            backgroundColor="none"
            fontSize={theme.textVariants.headlineMedium.fontSize}
            maxFontSizeMultiplier={theme.textVariants.headlineMedium.maxFontSizeMultiplier}
            maxLength={NICKNAME_MAX_LENGTH}
            placeholder="Nickname"
            placeholderTextColor={theme.colors.textTertiary}
            testID="customize/name"
            textAlign="center"
            value={accountName}
            onBlur={(): void => setFocused(false)}
            onChangeText={(newName): void => setAccountName(newName)}
            onFocus={(): void => setFocused(true)}
          />
          {!focused && (
            <AnimatedButton
              IconName={PencilIcon}
              emphasis={ButtonEmphasis.Secondary}
              entering={FadeIn}
              exiting={FadeOut}
              size={ButtonSize.Small}
              onPress={focusInputWithKeyboard}
            />
          )}
        </Flex>
        <Text color="textSecondary" variant="bodyLarge">
          {shortenAddress(address)}
        </Text>
      </Flex>
    </Flex>
  )
}
