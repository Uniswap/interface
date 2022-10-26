import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { TFunction } from 'i18next'
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, TextInput as NativeTextInput } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import PencilIcon from 'src/assets/icons/pencil-detailed.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { AnimatedButton, Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { usePendingAccounts } from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { OnboardingScreens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.EditName>

export function EditNameScreen({ navigation, route: { params } }: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const theme = useAppTheme()

  // Reference pending accounts to avoid any lag in saga import.
  const pendingAccount = Object.values(usePendingAccounts())?.[0]

  const [newAccountName, setNewAccountName] = useState<string>(pendingAccount?.name ?? '')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const beforeRemoveListener = () => {
      dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    }
    navigation.addListener('beforeRemove', beforeRemoveListener)

    const shouldRenderBackButton = navigation.getState().index === 0
    if (shouldRenderBackButton) {
      navigation.setOptions({
        headerLeft: () => (
          <BackButton
            onPressBack={() => {
              navigation.goBack()
            }}
          />
        ),
      })
    }
    return () => navigation.removeListener('beforeRemove', beforeRemoveListener)
  }, [dispatch, navigation, theme.colors.textPrimary])

  const onPressNext = () => {
    navigation.navigate({
      name: OnboardingScreens.Backup,
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
        'It has a public address for making transactions, and a nickname that’s only visible to you.'
      )}
      title={t('Say hello to your new wallet')}>
      <Box>
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

const defaultNames = (t: TFunction) => {
  return [
    [t('Main wallet'), t('Test wallet')],
    [t('Investing'), t('Savings'), t('NFTs')],
  ]
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
}) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const textInputRef = useRef<NativeTextInput>(null)

  const focusInputWithKeyboard = () => {
    textInputRef.current?.focus()
  }

  return (
    <Flex centered gap="lg">
      <Flex centered gap="none" width="100%">
        <Flex centered row gap="none">
          <TextInput
            ref={textInputRef}
            backgroundColor="none"
            fontSize={28}
            placeholder="Nickname"
            placeholderTextColor={theme.colors.textTertiary}
            testID="customize/name"
            textAlign="center"
            value={accountName}
            onBlur={() => setFocused(false)}
            onChangeText={(newName) => setAccountName(newName)}
            onFocus={() => setFocused(true)}
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
      <Flex centered gap="md">
        {defaultNames(t).map((items, i) => (
          <Flex key={i} centered row>
            {items.map((item) => (
              <TouchableArea
                key={item}
                backgroundColor={accountName === item ? 'background3' : 'background1'}
                borderRadius="xl"
                px="md"
                py="sm"
                onPress={() => setAccountName(item)}>
                <Text color="textPrimary" variant="buttonLabelSmall">
                  {item}
                </Text>
              </TouchableArea>
            ))}
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
