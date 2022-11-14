import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loading } from 'src/components/loading'
import { useSelectWalletScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { importAccountSagaName } from 'src/features/import/importAccountSaga'
import WalletPreviewCard from 'src/features/import/WalletPreviewCard'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { AccountType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { usePendingAccounts } from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectWallet>

const FALLBACK_ID = 'fallback'
export function SelectWalletScreen({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { status } = useSagaStatus(importAccountSagaName)
  const isLoadingAccounts = status === SagaStatus.Started

  const pendingAccounts = usePendingAccounts()
  const addresses = Object.values(pendingAccounts)
    .filter((a) => a.type === AccountType.SignerMnemonic)
    .sort(
      (a, b) =>
        (a as SignerMnemonicAccount).derivationIndex - (b as SignerMnemonicAccount).derivationIndex
    )
    .map((account) => account.address)

  const { data, loading, refetch, error } = useSelectWalletScreenQuery({
    variables: { ownerAddresses: addresses },
  })

  const onRetry = useCallback(() => refetch(), [refetch])

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
      : [{ id: FALLBACK_ID, ownerAddress: addresses[0], tokensTotalDenominatedValue: null }] // if query returned null, fallback to the first address
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

  useEffect(() => {
    const beforeRemoveListener = () => {
      dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    }
    navigation.addListener('beforeRemove', beforeRemoveListener)
    return () => navigation.removeListener('beforeRemove', beforeRemoveListener)
  }, [dispatch, navigation])

  useEffect(() => {
    // In the event that the initial state of `selectedAddresses` is empty due to delay in saga loading,
    // we need to set this after the loading so that the fallback account is selected.
    if (isLoadingAccounts || loading || selectedAddresses.length > 0) return

    initialShownAccounts
      ?.filter((a) => a != null && a?.ownerAddress != null)
      .map((a) => setSelectedAddresses(a!.ownerAddress))
  }, [initialShownAccounts, isLoadingAccounts, loading, selectedAddresses.length])

  const onPress = (address: string) => {
    if (initialShownAccounts?.length === 1 && selectedAddresses.length === 1) return
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
      <OnboardingScreen
        subtitle={
          !error
            ? t(
                'You can import any of your wallet addresses that are associated with your recovery phrase.'
              )
            : undefined
        }
        title={!error ? t('Select addresses to import') : ''}>
        {error ? (
          <BaseCard.ErrorState
            retryButtonLabel={t('Retry')}
            title={t("Couldn't load addresses")}
            onRetry={onRetry}
          />
        ) : isLoadingAccounts || loading ? (
          <Flex grow justifyContent="space-between">
            <Loading repeat={5} type="wallets" />
          </Flex>
        ) : (
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
        )}
        <Box opacity={error ? 0 : 1}>
          <Button
            disabled={isLoadingAccounts || loading || !!error || selectedAddresses.length === 0}
            label={t('Continue')}
            name={ElementName.Next}
            onPress={onSubmit}
          />
        </Box>
      </OnboardingScreen>
    </>
  )
}
