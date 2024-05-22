import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { OnboardingScreens } from 'src/screens/Screens'
import { Button, Flex, Loader } from 'ui/src'
import { useSelectWalletScreenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import WalletPreviewCard from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'
import { ImportType } from 'wallet/src/features/onboarding/types'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { AccountType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { ElementName } from 'wallet/src/telemetry/constants'

const FORCED_LOADING_DURATION = 3 * ONE_SECOND_MS // 3s

interface ImportableAccount {
  ownerAddress: string
  balance: number | undefined
}

function isImportableAccount(account: {
  ownerAddress: string | undefined
  balance: Maybe<number>
}): account is ImportableAccount {
  return (account as ImportableAccount).ownerAddress !== undefined
}

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectWallet>

export function SelectWalletScreen({ navigation, route: { params } }: Props): JSX.Element {
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

  const isImportingAccounts = addresses.length !== NUMBER_OF_WALLETS_TO_IMPORT

  const { data, loading, refetch, error } = useSelectWalletScreenQuery({
    variables: { ownerAddresses: addresses },
    /*
     * Wait until all the addresses have been added to the store before querying.
     * Also prevents an extra API call when user navigates back and clears pending accounts.
     */
    skip: isImportingAccounts,
  })

  const onRetry = useCallback(() => refetch(), [refetch])

  const allAddressBalances = data?.portfolios

  const initialShownAccounts = useMemo<ImportableAccount[] | undefined>(() => {
    const filteredAccounts = allAddressBalances
      ?.map((address) => ({
        ownerAddress: address?.ownerAddress,
        balance: address?.tokensTotalDenominatedValue?.value,
      }))
      .filter(isImportableAccount)

    const accountsWithBalance = filteredAccounts?.filter(
      (address) => address.balance && address.balance > 0
    )

    if (accountsWithBalance?.length) {
      return accountsWithBalance
    }

    // if all addresses have 0 total token value, show the first address
    const firstFilteredAccount = filteredAccounts?.[0]
    if (firstFilteredAccount) {
      return [firstFilteredAccount]
    }

    // if query for address balances returned null, show the first address
    const firstPendingAddress = addresses[0]
    if (firstPendingAddress) {
      return [{ ownerAddress: firstPendingAddress, balance: undefined }]
    }
  }, [addresses, allAddressBalances])

  const initialSelectedAddresses = useMemo(
    () =>
      initialShownAccounts
        ?.map((account) => account?.ownerAddress)
        .filter((address): address is string => typeof address === 'string') ?? [],
    [initialShownAccounts]
  )

  const isOnlyOneAccount = initialShownAccounts?.length === 1

  const showError = error && !initialShownAccounts?.length

  const [selectedAddresses, setSelectedAddresses] = useReducer(
    (currentAddresses: string[], addressToProcess: string) =>
      currentAddresses.includes(addressToProcess)
        ? currentAddresses.filter((address) => address !== addressToProcess)
        : [...currentAddresses, addressToProcess],
    initialSelectedAddresses
  )

  useEffect(() => {
    const beforeRemoveListener = (): void => {
      // Remove all pending signer accounts when navigating back
      dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
    }
    navigation.addListener('beforeRemove', beforeRemoveListener)
    return () => navigation.removeListener('beforeRemove', beforeRemoveListener)
  }, [dispatch, navigation, pendingAccounts])

  useEffect(() => {
    /*
     * In the event that the initial state of `selectedAddresses` is empty due to
     * delay in importAccountSaga, we need to set the fallback account as selected
     */
    if (isImportingAccounts || loading || selectedAddresses.length > 0) {
      return
    }

    initialSelectedAddresses.forEach((address) => setSelectedAddresses(address))
  }, [initialSelectedAddresses, isImportingAccounts, loading, selectedAddresses.length])

  const onPress = (address: string): void => {
    if (initialShownAccounts?.length === 1 && selectedAddresses.length === 1) {
      return
    }
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
            notificationsEnabled: !!pendingAccounts[address]?.pushNotificationsEnabled,
          })
        )
      } else {
        if (!isFirstAccountActive.current) {
          dispatch(setAccountAsActive(address))
          isFirstAccountActive.current = true
        }
        const account = pendingAccounts[address]
        if (account && !account.name && account.type !== AccountType.Readonly) {
          dispatch(
            editAccountActions.trigger({
              type: EditAccountAction.Rename,
              address,
              newName: t('onboarding.wallet.defaultName', { number: account.derivationIndex + 1 }),
            })
          )
        }
      }
    })

    navigation.navigate({
      name:
        params?.importType === ImportType.Restore
          ? OnboardingScreens.Notifications
          : OnboardingScreens.Backup,
      params,
      merge: true,
    })
  }, [addresses, navigation, params, selectedAddresses, dispatch, pendingAccounts, t])

  // Force a fixed duration loading state for smoother transition (as we show different UI for 1 vs multiple wallets)
  const [isForcedLoading, setIsForcedLoading] = useState(true)
  useTimeout(() => setIsForcedLoading(false), FORCED_LOADING_DURATION)

  const isLoading = loading || isForcedLoading || isImportingAccounts

  const title = isLoading
    ? t('account.wallet.select.loading.title')
    : t('account.wallet.select.title_one', { count: initialShownAccounts?.length ?? 0 })

  const subtitle = isLoading ? t('account.wallet.select.loading.subtitle') : undefined

  return (
    <>
      <OnboardingScreen
        subtitle={!showError ? subtitle : undefined}
        title={!showError ? title : ''}>
        {showError ? (
          <BaseCard.ErrorState
            retryButtonLabel={t('common.button.retry')}
            title={t('account.wallet.select.error')}
            onRetry={onRetry}
          />
        ) : isLoading ? (
          <Flex grow justifyContent="space-between">
            <Loader.Wallets repeat={5} />
          </Flex>
        ) : (
          <ScrollView>
            <Flex gap="$spacing12">
              {initialShownAccounts?.map((account, i) => {
                const { ownerAddress, balance } = account
                return (
                  <WalletPreviewCard
                    key={ownerAddress}
                    address={ownerAddress}
                    balance={balance}
                    hideSelectionCircle={isOnlyOneAccount}
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
        <Flex opacity={showError ? 0 : 1}>
          <Button
            disabled={
              isImportingAccounts || isLoading || !!showError || selectedAddresses.length === 0
            }
            testID={ElementName.Next}
            onPress={onSubmit}>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </OnboardingScreen>
    </>
  )
}
