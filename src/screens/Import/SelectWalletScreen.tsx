import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useReducer, useRef } from 'react'
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
import { ElementName } from 'src/features/telemetry/constants'
import { AccountType, NativeAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { usePendingAccounts } from 'src/features/wallet/hooks'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectWallet>

export function SelectWalletScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const { status } = useSagaStatus(importAccountSagaName)
  const loadingAccounts = status === SagaStatus.Started

  const pendingAccounts = usePendingAccounts()
  const addresses = Object.values(pendingAccounts)
    .filter((a) => a.type === AccountType.Native)
    .sort((a, b) => (a as NativeAccount).derivationIndex - (b as NativeAccount).derivationIndex)
    .map((account) => account.address)

  const [selectedAddresses, setSelectedAddresses] = useReducer(
    (currentAddresses: string[], addressToProcess: string) =>
      currentAddresses.includes(addressToProcess)
        ? currentAddresses.filter((a: string) => a !== addressToProcess)
        : [...currentAddresses, addressToProcess],
    []
  )
  const onPress = (address: string) => setSelectedAddresses(address)

  const isFirstAccountActive = useRef(false) // to keep track of first account activated from the selected accounts
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
      } else {
        if (!isFirstAccountActive.current) {
          dispatch(activateAccount(address))
          isFirstAccountActive.current = true
        }
      }
    })
    navigation.navigate({ name: OnboardingScreens.Notifications, params, merge: true })
  }, [dispatch, addresses, navigation, selectedAddresses, isFirstAccountActive, params])

  return (
    <OnboardingScreen
      subtitle={t('We found several wallets associated with your recovery phrase.')}
      title={t('Select wallets to import')}>
      {loadingAccounts ? (
        <ActivityIndicator />
      ) : (
        <ScrollView>
          <Flex gap="sm">
            {addresses.map((a, i) => {
              return (
                <WalletPreviewCard
                  key={a}
                  address={a}
                  name={ElementName.WalletCard}
                  selected={selectedAddresses.includes(a)}
                  testID={`${ElementName.WalletCard}-${i + 1}`}
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
        name={ElementName.Next}
        testID={ElementName.Next}
        variant="onboard"
        onPress={onSubmit}
      />
    </OnboardingScreen>
  )
}
