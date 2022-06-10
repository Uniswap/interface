import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { Dispatch, SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import Disclaimer from 'src/features/import/Disclaimer'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.EditName>

export function EditNameScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  // avoids `useActiveAccount` since response may be null
  const activeAccount = useActiveAccount()
  const [newAccountName, setNewAccountName] = useState(activeAccount?.name ?? '')

  const onPressNext = () => {
    navigation.navigate(OnboardingScreens.SelectColor)

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
      stepCount={4}
      stepNumber={0}
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
      <Flex grow justifyContent="flex-end">
        <Disclaimer />
      </Flex>
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

function CustomizationSection({
  address,
  accountName,
  setAccountName,
}: {
  address: Address
  accountName: string
  setAccountName: Dispatch<SetStateAction<string>>
}) {
  return (
    <Flex centered gap="lg">
      <Flex centered gap="none" width="100%">
        <Flex centered row gap="sm" width="100%">
          <TextInput
            fontSize={28}
            placeholder="Nickname"
            testID="customize/name"
            textAlign="center"
            value={accountName}
            width="100%"
            onChangeText={(newName) => setAccountName(newName)}
          />
        </Flex>
        <Text color="deprecated_textColor" opacity={0.7} variant="body1">
          {shortenAddress(address)}
        </Text>
      </Flex>
    </Flex>
  )
}
