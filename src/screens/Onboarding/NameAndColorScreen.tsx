import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { Dispatch, SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextInput } from 'src/components/input/TextInput'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { activeAccountSelector } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.NameAndColor>

export function NameAndColorScreen({ navigation }: Props) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  // avoids `useActiveAccount` since response may be null
  const activeAccount = useAppSelector(activeAccountSelector)
  const [newAccountName, setNewAccountName] = useState(activeAccount?.name ?? '')

  const onPressNext = () => {
    navigation.navigate(OnboardingScreens.Backup)

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
      subtitle={t(
        'Your wallet is your ticket to the world of crypto and web3--give it a nickname and color to get started.'
      )}
      title={t('Say hello to your new wallet')}>
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
        <TextInput
          fontSize={28}
          placeholder="Nickname"
          testID="customize/name"
          textAlign="center"
          value={accountName}
          width="100%"
          onChangeText={(newName) => setAccountName(newName)}
        />
        <Text color="textColor" opacity={0.7} variant="body">
          {shortenAddress(address)}
        </Text>
      </Flex>
      <Flex centered bg="gray50" borderRadius="lg" p="lg">
        <QRCode size={180} value={address} />
      </Flex>
    </Flex>
  )
}
