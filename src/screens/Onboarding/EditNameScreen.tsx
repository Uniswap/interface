import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { TFunction } from 'i18next'
import React, { Dispatch, SetStateAction, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, TextInput as NativeTextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import PencilIcon from 'src/assets/icons/pencil-detailed.svg'
import { AnimatedButton } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useActiveAccount, usePendingAccounts } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.EditName>

export function EditNameScreen({ navigation, route: { params } }: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const activeAccount = useActiveAccount()
  // Reference pending accounts to avoid any lag in saga import.
  const pendingAccountName = Object.values(usePendingAccounts())[0]?.name

  const [newAccountName, setNewAccountName] = useState<string>(pendingAccountName ?? '')

  const onPressNext = () => {
    navigation.navigate({
      name: OnboardingScreens.SelectColor,
      merge: true,
      params,
    })

    if (activeAccount) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.Rename,
          address: activeAccount.address,
          newName: newAccountName,
        })
      )
    }
  }

  return (
    <OnboardingScreen
      subtitle={t('Easily identify your wallet in the app by giving it a nickname and color.')}
      title={t('Give your wallet a nickname')}>
      <Box>
        {activeAccount ? (
          <CustomizationSection
            accountName={newAccountName}
            address={activeAccount.address}
            setAccountName={setNewAccountName}
          />
        ) : (
          <ActivityIndicator />
        )}
      </Box>
      <Flex justifyContent="flex-end">
        <PrimaryButton
          label={t('Next')}
          name={ElementName.Next}
          testID={ElementName.Next}
          variant="onboard"
          onPress={onPressNext}
        />
      </Flex>
    </OnboardingScreen>
  )
}

const defaultNames = (t: TFunction) => {
  return [
    [t('Main Wallet'), t('Test Wallet')],
    [t('Investing'), t('Savings'), t('NFTs')],
  ]
}

function CustomizationSection({
  address,
  accountName,
  setAccountName,
}: {
  address: Address
  accountName: string
  setAccountName: Dispatch<SetStateAction<string>>
}) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const textInputRef = useRef<NativeTextInput>(null)
  const [focused, setFocused] = useState(false)

  const focusInputWithKeyboard = () => {
    textInputRef.current?.focus()
  }

  return (
    <Flex centered gap="lg">
      <Flex centered gap="none" width="100%">
        <Flex centered row gap="none">
          <TextInput
            autoFocus={true}
            fontSize={28}
            inputRef={textInputRef}
            placeholder="Nickname"
            placeholderTextColor={theme.colors.accentAction}
            testID="customize/name"
            textAlign="center"
            value={accountName}
            onBlur={() => setFocused(false)}
            onChangeText={(newName) => setAccountName(newName)}
            onFocus={() => setFocused(true)}
          />
          {!focused && (
            <AnimatedButton
              backgroundColor="translucentBackground"
              borderRadius="full"
              entering={FadeIn}
              exiting={FadeOut}
              p="sm"
              onPress={focusInputWithKeyboard}>
              <PencilIcon />
            </AnimatedButton>
          )}
        </Flex>
        <Text color="textSecondary" opacity={0.7} variant="body">
          {shortenAddress(address)}
        </Text>
      </Flex>
      <Flex centered gap="md">
        {defaultNames(t).map((items, i) => (
          <Flex key={i} centered row>
            {items.map((item) => (
              <TextButton
                key={item}
                backgroundColor="translucentBackground"
                borderRadius="xl"
                px="md"
                py="sm"
                textColor="white"
                textVariant="smallLabel"
                onPress={() => setAccountName(item)}>
                {item}
              </TextButton>
            ))}
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
