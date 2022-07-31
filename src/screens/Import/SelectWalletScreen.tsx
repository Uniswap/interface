import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense, useCallback, useMemo, useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useLazyLoadQuery } from 'react-relay'
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
import { SelectWalletScreenQuery } from 'src/screens/Import/__generated__/SelectWalletScreenQuery.graphql'
import { OnboardingScreens } from 'src/screens/Screens'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectWallet>

const selectWalletScreenQuery = graphql`
  query SelectWalletScreenQuery($ownerAddresses: [String!]!) {
    portfolios(ownerAddresses: $ownerAddresses) {
      ownerAddress
      tokensTotalDenominatedValue {
        value
      }
    }
  }
`

export function SelectWalletScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()

  const pendingAccounts = usePendingAccounts()
  const addresses = Object.values(pendingAccounts)
    .filter((a) => a.type === AccountType.Native)
    .sort((a, b) => (a as NativeAccount).derivationIndex - (b as NativeAccount).derivationIndex)
    .map((account) => account.address)

  return (
    <OnboardingScreen
      subtitle={t('We found several wallets associated with your recovery phrase.')}
      title={t('Select wallets to import')}>
      <Suspense fallback={<ActivityIndicator />}>
        <WalletPreviewList addresses={addresses} navigation={navigation} params={params} />
      </Suspense>
    </OnboardingScreen>
  )
}

function WalletPreviewList({
  addresses,
  navigation,
  params,
}: {
  addresses: string[]
  navigation: any
  params: any
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const { status } = useSagaStatus(importAccountSagaName)
  const loadingAccounts = status === SagaStatus.Started

  const allAddressBalances = useLazyLoadQuery<SelectWalletScreenQuery>(selectWalletScreenQuery, {
    ownerAddresses: addresses,
  }).portfolios

  const initialSelectedAccounts = useMemo(() => {
    const filtered = allAddressBalances?.filter(
      (portfolio) =>
        portfolio?.tokensTotalDenominatedValue?.value &&
        portfolio.tokensTotalDenominatedValue.value > 0
    )

    // if none of the addresses has a balance then just display the first one
    return filtered?.length
      ? filtered
      : allAddressBalances?.[0]
      ? [allAddressBalances?.[0]]
      : undefined
  }, [allAddressBalances])

  const [unselectedAddresses, setUnselectedAddresses] = useReducer(
    (currentAddresses: string[], addressToProcess: string) =>
      currentAddresses.includes(addressToProcess)
        ? currentAddresses.filter((a: string) => a !== addressToProcess)
        : [...currentAddresses, addressToProcess],
    []
  )

  const onPress = (address: string) => {
    setUnselectedAddresses(address)
  }

  const isFirstAccountActive = useRef(false) // to keep track of first account activated from the selected accounts
  const onSubmit = useCallback(() => {
    const selectedAddresses =
      initialSelectedAccounts
        ?.filter((portfolio) => !unselectedAddresses.includes(portfolio?.ownerAddress || ''))
        .map((portfolio) => portfolio?.ownerAddress) || []
    addresses.map((address) => {
      // Remove unselected accounts from store.
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
  }, [
    dispatch,
    addresses,
    navigation,
    unselectedAddresses,
    isFirstAccountActive,
    params,
    initialSelectedAccounts,
  ])

  return (
    <>
      {loadingAccounts ? (
        <ActivityIndicator />
      ) : (
        <ScrollView>
          <Flex gap="sm">
            {initialSelectedAccounts?.map((portfolio, i) => {
              const { ownerAddress, tokensTotalDenominatedValue } = portfolio!

              return (
                <WalletPreviewCard
                  key={ownerAddress}
                  address={ownerAddress}
                  balance={tokensTotalDenominatedValue?.value || 0}
                  name={ElementName.WalletCard}
                  selected={!unselectedAddresses.includes(ownerAddress)}
                  testID={`${ElementName.WalletCard}-${i + 1}`}
                  onSelect={onPress}
                />
              )
            })}
          </Flex>
        </ScrollView>
      )}
      <PrimaryButton
        disabled={
          initialSelectedAccounts && initialSelectedAccounts.length <= unselectedAddresses.length
        }
        label={t('Next')}
        name={ElementName.Next}
        testID={ElementName.Next}
        variant="onboard"
        onPress={onSubmit}
      />
    </>
  )
}
