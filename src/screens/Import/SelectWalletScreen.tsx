import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { graphql } from 'babel-plugin-relay/macro'
import React, { useCallback, useMemo, useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useLazyLoadQuery } from 'react-relay'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Suspense } from 'src/components/data/Suspense'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
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

  const { status } = useSagaStatus(importAccountSagaName)
  const isLoadingAccounts = status === SagaStatus.Started

  return (
    <OnboardingScreen
      subtitle={t(
        'You can import any of your wallet addresses that are associated with your recovery phrase.'
      )}
      title={t('Select addresses to import')}>
      <Suspense
        fallback={
          <Flex grow justifyContent="space-between">
            <Loading repeat={4} type="wallets" />
            <Button disabled label={t('Continue')} name={ElementName.Next} />
          </Flex>
        }>
        <WalletPreviewList
          isLoadingAccounts={isLoadingAccounts}
          navigation={navigation}
          params={params}
        />
      </Suspense>
    </OnboardingScreen>
  )
}

const suspend = () => new Promise(() => {})

function WalletPreviewList({
  isLoadingAccounts,
  navigation,
  params,
}: {
  isLoadingAccounts: boolean
  navigation: any
  params: any
}) {
  // Suspend until all pending accounts to check balances for have been imported
  if (isLoadingAccounts) {
    throw suspend()
  }

  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const pendingAccounts = usePendingAccounts()
  const addresses = Object.values(pendingAccounts)
    .filter((a) => a.type === AccountType.SignerMnemonic)
    .sort(
      (a, b) =>
        (a as SignerMnemonicAccount).derivationIndex - (b as SignerMnemonicAccount).derivationIndex
    )
    .map((account) => account.address)

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

    // if none of the addresses have a balance then just display the first one
    return filtered?.length
      ? filtered
      : allAddressBalances?.length
      ? [allAddressBalances?.[0]]
      : [{ ownerAddress: addresses[0], tokensTotalDenominatedValue: null }] // if query returned null, fallback to the first address
  }, [allAddressBalances, addresses])

  const [selectedAddresses, setSelectedAddresses] = useReducer(
    (currentAddresses: string[], addressToProcess: string) =>
      currentAddresses.includes(addressToProcess)
        ? currentAddresses.filter((a: string) => a !== addressToProcess)
        : [...currentAddresses, addressToProcess],
    initialShownAccounts
      ?.filter((a) => a != null && a?.ownerAddress != null)
      .map((a) => a!.ownerAddress) ?? []
  )

  const onPress = (address: string) => {
    if (initialShownAccounts?.length === 1) return
    setSelectedAddresses(address)
  }

  const isFirstAccountActive = useRef(false) // to keep track of first account activated from the selected accounts
  const onSubmit = useCallback(() => {
    addresses.forEach((address) => {
      // Remove unselected accounts from store.
      if (!selectedAddresses.includes(address)) {
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.Remove,
            address,
            notificationsEnabled: !!pendingAccounts[address].pushNotificationsEnabled,
          })
        )
      } else {
        if (!isFirstAccountActive.current) {
          dispatch(activateAccount(address))
          isFirstAccountActive.current = true
        }
        const account = pendingAccounts[address]
        if (!account.name && account.type !== AccountType.Readonly) {
          dispatch(
            editAccountActions.trigger({
              type: EditAccountAction.Rename,
              address,
              newName: t('Wallet {{ number }}', { number: account.derivationIndex + 1 }),
            })
          )
        }
      }
    })
    navigation.navigate({ name: OnboardingScreens.Backup, params, merge: true })
  }, [
    dispatch,
    addresses,
    pendingAccounts,
    navigation,
    selectedAddresses,
    isFirstAccountActive,
    params,
    t,
  ])

  return (
    <>
      <ScrollView>
        <Flex gap="sm">
          {initialShownAccounts?.map((portfolio, i) => {
            const { ownerAddress, tokensTotalDenominatedValue } = portfolio!

            return (
              <WalletPreviewCard
                key={ownerAddress}
                address={ownerAddress}
                balance={tokensTotalDenominatedValue?.value}
                name={ElementName.WalletCard}
                selected={selectedAddresses.includes(ownerAddress)}
                testID={`${ElementName.WalletCard}-${i + 1}`}
                onSelect={onPress}
              />
            )
          })}
        </Flex>
      </ScrollView>

      <Button
        disabled={selectedAddresses.length === 0}
        label={t('Continue')}
        name={ElementName.Next}
        onPress={onSubmit}
      />
    </>
  )
}
