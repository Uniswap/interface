import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'
import WalletPreviewCard from 'src/features/import/WalletPreviewCard'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ImportType } from 'src/features/onboarding/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { OnboardingScreens } from 'src/screens/Screens'
import { EMPTY_ARRAY } from 'wallet/src/constants/misc'
import { useSelectWalletScreenQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import {
  Account,
  AccountType,
  SignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { useAccounts, usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'
import { useTimeout } from 'wallet/src/utils/timing'

const FORCED_LOADING_DURATION = 3 * ONE_SECOND_MS // 3s

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectWallet>

const FALLBACK_ID = 'fallback'
export function SelectWalletScreen({ navigation, route: { params } }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const accounts = useAccounts()
  const initialViewOnlyWallets = useRef<Account[]>( // Hold onto reference of view-only wallets before importing more wallets
    Object.values(accounts).filter((a) => a.type === AccountType.Readonly)
  )

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

  const initialShownAccounts = useMemo(() => {
    const filtered = allAddressBalances?.filter(
      (portfolio) =>
        portfolio?.tokensTotalDenominatedValue?.value &&
        portfolio.tokensTotalDenominatedValue.value > 0
    )

    if (filtered?.length) {
      return filtered
    }

    // if all addresses have 0 total token value, show the first address
    if (allAddressBalances?.length) {
      return [allAddressBalances?.[0]]
    }

    // if query for address balances returned null, show the first address
    if (addresses.length) {
      return [{ id: FALLBACK_ID, ownerAddress: addresses[0], tokensTotalDenominatedValue: null }]
    }

    return EMPTY_ARRAY
  }, [addresses, allAddressBalances])

  const isOnlyOneAccount = initialShownAccounts.length === 1

  const showError = error && !initialShownAccounts.length

  const [selectedAddresses, setSelectedAddresses] = useReducer(
    (currentAddresses: string[], addressToProcess: string) =>
      currentAddresses.includes(addressToProcess)
        ? currentAddresses.filter((a: string) => a !== addressToProcess)
        : [...currentAddresses, addressToProcess],
    initialShownAccounts
      ?.filter((a) => a != null && a?.ownerAddress != null)
      .map((a) => a.ownerAddress) ?? []
  )

  useEffect(() => {
    const beforeRemoveListener = (): void => {
      // Remove all pending signer accounts when navigating back
      dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
      /**
       * When we go back and exit onboarding, we re-add any initial view-only wallets
       * that were overwritten during the import flow. (Due to how our redux account store is setup,
       * with the key being the address, when the mnemonic version of the wallet is imported,
       * it overwrites the view-only wallet.)
       */
      for (const viewOnlyWallet of initialViewOnlyWallets.current) {
        const pendingAccountAddresses = Object.keys(pendingAccounts)
        if (pendingAccountAddresses.includes(viewOnlyWallet.address)) {
          dispatch(
            importAccountActions.trigger({
              type: ImportAccountType.Address,
              address: viewOnlyWallet.address,
            })
          )
          dispatch(pendingAccountActions.trigger(PendingAccountActions.Activate))
        }
      }
    }
    navigation.addListener('beforeRemove', beforeRemoveListener)
    return () => navigation.removeListener('beforeRemove', beforeRemoveListener)
  }, [dispatch, navigation, pendingAccounts])

  useEffect(() => {
    /*
     * In the event that the initial state of `selectedAddresses` is empty due to
     * delay in importAccountSaga, we need to set the fallback account as selected
     */
    if (isImportingAccounts || loading || selectedAddresses.length > 0) return

    initialShownAccounts
      ?.filter((a) => a != null && a?.ownerAddress != null)
      .map((a) => setSelectedAddresses(a.ownerAddress))
  }, [initialShownAccounts, isImportingAccounts, loading, selectedAddresses.length])

  const onPress = (address: string): void => {
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
              newName: t('Wallet {{ number }}', { number: account.derivationIndex + 1 }),
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
    ? t('Searching for wallets')
    : isOnlyOneAccount
    ? t('One wallet found')
    : t('Select wallets to import')

  const subtitle = isLoading
    ? t('Your wallets will appear below.')
    : isOnlyOneAccount
    ? t('Please confirm that the wallet below is the one you’d like to import.')
    : t('We found several wallets associated with your recovery phrase.')

  return (
    <>
      <OnboardingScreen
        subtitle={!showError ? subtitle : undefined}
        title={!showError ? title : ''}>
        {showError ? (
          <BaseCard.ErrorState
            retryButtonLabel={t('Retry')}
            title={t("Couldn't load addresses")}
            onRetry={onRetry}
          />
        ) : isLoading ? (
          <Flex grow justifyContent="space-between">
            <Loader.Wallets repeat={5} />
          </Flex>
        ) : (
          <ScrollView>
            <Flex gap="spacing12">
              {initialShownAccounts?.map((portfolio, i) => {
                const { ownerAddress, tokensTotalDenominatedValue } = portfolio
                return (
                  <WalletPreviewCard
                    key={ownerAddress}
                    address={ownerAddress}
                    balance={tokensTotalDenominatedValue?.value}
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
        <Box opacity={showError ? 0 : 1}>
          <Button
            disabled={
              isImportingAccounts || isLoading || !!showError || selectedAddresses.length === 0
            }
            label={t('Continue')}
            name={ElementName.Next}
            onPress={onSubmit}
          />
        </Box>
      </OnboardingScreen>
    </>
  )
}
