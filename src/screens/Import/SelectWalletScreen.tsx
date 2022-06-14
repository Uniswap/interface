import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { importAccountSagaName } from 'src/features/import/importAccountSaga'
import WalletPreviewCard from 'src/features/import/WalletPreviewCard'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { usePendingAccounts } from 'src/features/wallet/hooks'
import { OnboardingScreens } from 'src/screens/Screens'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectWallet>

export function SelectWalletScreen({ navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const { status } = useSagaStatus(importAccountSagaName)
  const loadingAccounts = status === SagaStatus.Started

  const pendingAccounts = usePendingAccounts()

  // for now the importedIndex only comes from adding accounts from importMnemonicAccounts
  // this can only be done this way for now since as far as I saw accounts from redux is an object instead of an array that's why its not ordered
  let addresses = Object.values(pendingAccounts).reduce((addressesArray, importedAccount) => {
    if (importedAccount.importedIndex !== undefined) {
      addressesArray[importedAccount.importedIndex] = importedAccount.address
    }
    return addressesArray
  }, Array(Object.keys(pendingAccounts).length))
  // if any of the spaces of the address array is null just default to the old addresses array based from keys
  if (addresses.some((address) => !address)) {
    addresses = Object.keys(pendingAccounts)
  }

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
    navigation.navigate(OnboardingScreens.Notifications)
  }, [dispatch, addresses, navigation, selectedAddresses])

  return (
    <OnboardingScreen
      stepCount={4}
      stepNumber={1}
      subtitle={t('We found several wallets associated with your seed phrase.')}
      title={t('Select wallets to import')}>
      {loadingAccounts ? (
        <ActivityIndicator />
      ) : (
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
      )}
      <PrimaryButton
        disabled={selectedAddresses.length === 0}
        label={t('Next')}
        variant="onboard"
        onPress={onSubmit}
      />
    </OnboardingScreen>
  )
}
