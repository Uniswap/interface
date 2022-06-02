import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import WalletPreviewCard from 'src/features/import/WalletPreviewCard'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectWallet>

export function SelectWalletScreen({
  navigation,
  route: {
    params: { addresses },
  },
}: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [selectedAddresses, setSelectedAddresses] = useReducer(
    (currentAddresses: string[], addressToProcess: string) =>
      currentAddresses.includes(addressToProcess)
        ? currentAddresses.filter((a: string) => a !== addressToProcess)
        : [...currentAddresses, addressToProcess],
    []
  )
  const onPress = (address: string) => setSelectedAddresses(address)

  const onSubmit = useCallback(() => {
    addresses.map((address) => {
      // Remove unselected accounst from store.
      if (!selectedAddresses.includes(address)) {
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.Remove,
            address,
          })
        )
      }
    })
    // Set first account as active account.
    dispatch(activateAccount(selectedAddresses[0]))
    navigation.navigate(OnboardingScreens.Notifications)
  }, [dispatch, addresses, navigation, selectedAddresses])

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={1}
      subtitle={t('We found several wallets associated with your seed phrase.')}
      title={t('Select wallets to import')}>
      <ScrollView>
        <Flex gap="sm">
          {addresses.map((a) => {
            return (
              <WalletPreviewCard
                key={a}
                address={a}
                selected={selectedAddresses.includes(a)}
                onSelect={onPress}
              />
            )
          })}
        </Flex>
      </ScrollView>
      <PrimaryButton
        disabled={selectedAddresses.length === 0}
        label={t('Next')}
        variant="onboard"
        onPress={onSubmit}
      />
    </OnboardingScreen>
  )
}
