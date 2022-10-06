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
import { AccountType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
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
    .filter((a) => a.type === AccountType.SignerMnemonic)
    .sort(
      (a, b) =>
        (a as SignerMnemonicAccount).derivationIndex - (b as SignerMnemonicAccount).derivationIndex
    )
    .map((account) => account.address)

  return (
    <OnboardingScreen
      subtitle={t(
        'You can import any of your wallet addresses that are associated with your recovery phrase.'
      )}
      title={t('Select addresses to import')}>
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

  const accounts = usePendingAccounts()

  const { status } = useSagaStatus(importAccountSagaName)
  const loadingAccounts = status === SagaStatus.Started

  const data = useLazyLoadQuery<SelectWalletScreenQuery>(selectWalletScreenQuery, {
    ownerAddresses: addresses,
  })

  const allAddressBalances = data?.portfolios

  const initialShownAccounts = useMemo(() => {
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

  const maxBalanceAccount = useMemo(() => {
    return initialShownAccounts?.reduce((prev, curr) =>
      prev?.tokensTotalDenominatedValue?.value &&
      curr?.tokensTotalDenominatedValue?.value &&
      prev.tokensTotalDenominatedValue.value > curr.tokensTotalDenominatedValue.value
        ? prev
        : curr
    )
  }, [initialShownAccounts])

  const [selectedAddresses, setSelectedAddresses] = useReducer(
    (currentAddresses: string[], addressToProcess: string) =>
      currentAddresses.includes(addressToProcess)
        ? currentAddresses.filter((a: string) => a !== addressToProcess)
        : [...currentAddresses, addressToProcess],
    maxBalanceAccount ? [maxBalanceAccount.ownerAddress] : []
  )

  const onPress = (address: string) => {
    if (initialShownAccounts?.length === 1) return
    setSelectedAddresses(address)
  }

  const isFirstAccountActive = useRef(false) // to keep track of first account activated from the selected accounts
  const onSubmit = useCallback(() => {
    addresses.map((address) => {
      // Remove unselected accounts from store.
      if (!selectedAddresses.includes(address)) {
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.Remove,
            address,
            notificationsEnabled: !!accounts[address].pushNotificationsEnabled,
          })
        )
      } else {
        if (!isFirstAccountActive.current) {
          dispatch(activateAccount(address))
          isFirstAccountActive.current = true
        }
      }
    })
    navigation.navigate({ name: OnboardingScreens.Backup, params, merge: true })
  }, [dispatch, addresses, accounts, navigation, selectedAddresses, isFirstAccountActive, params])

  return (
    <>
      {loadingAccounts ? (
        <ActivityIndicator />
      ) : (
        <ScrollView>
          <Flex gap="sm">
            {initialShownAccounts?.map((portfolio, i) => {
              const { ownerAddress, tokensTotalDenominatedValue } = portfolio!

              return (
                <WalletPreviewCard
                  key={ownerAddress}
                  address={ownerAddress}
                  balance={tokensTotalDenominatedValue?.value || 0}
                  name={ElementName.WalletCard}
                  selected={selectedAddresses.includes(ownerAddress)}
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
        label={t('Continue')}
        name={ElementName.Next}
        testID={ElementName.Next}
        textVariant="largeLabel"
        variant="onboard"
        onPress={onSubmit}
      />
    </>
  )
}
