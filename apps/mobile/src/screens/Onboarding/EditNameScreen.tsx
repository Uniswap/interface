import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useResponsiveProp } from '@shopify/restyle'
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, TextInput as NativeTextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { AnimatedButton, Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TextInput } from 'src/components/input/TextInput'
import Trace from 'src/components/Trace/Trace'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import { Box, Flex, Text } from 'ui/src'
import PencilIcon from 'ui/src/assets/icons/pencil-detailed.svg'
import { NICKNAME_MAX_LENGTH } from 'wallet/src/constants/accounts'
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

  // we default it to `true` to avoid flickering of a pencil icon,
  // because CustomizationSection has `autoFocus=true`
  const [focused, setFocused] = useState(true)

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
          newName: newAccountName,
        })
      )
    }
  }

  return (
    <OnboardingScreen
      subtitle={t('This is a way to keep track of your wallet. Only you will see this.')}
      title={t('Give your wallet a nickname')}>
      <Box my="$spacing24">
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
        <Trace logPress element={ElementName.Continue}>
          <Button label={t('Create Wallet')} onPress={onPressNext} />
        </Trace>
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
  const { t } = useTranslation()
  const theme = useAppTheme()
  const textInputRef = useRef<NativeTextInput>(null)

  const focusInputWithKeyboard = (): void => {
    textInputRef.current?.focus()
  }

  const inputSize = useResponsiveProp({
    xs: theme.textVariants.headlineSmall.fontSize,
    sm: theme.textVariants.headlineMedium.fontSize,
  })

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
            backgroundColor="none"
            fontSize={inputSize}
            maxFontSizeMultiplier={theme.textVariants.headlineMedium.maxFontSizeMultiplier}
            maxLength={NICKNAME_MAX_LENGTH}
            placeholder="Nickname"
            placeholderTextColor={theme.colors.neutral3}
            testID="customize/name"
            textAlign="center"
            value={accountName}
            onBlur={(): void => setFocused(false)}
            onChangeText={setAccountName}
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
        <Flex centered gap="$spacing4">
          <Text color="$neutral3" variant="bodyMicro">
            {t('Your public address will be')}
          </Text>
          <Text color="$neutral3" variant="buttonLabelSmall">
            {shortenAddress(address)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
