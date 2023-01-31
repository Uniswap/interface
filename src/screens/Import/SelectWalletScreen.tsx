import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useSelectWalletScreenQuery } from 'src/data/__generated__/types-and-hooks'
import { IMPORT_WALLET_AMOUNT } from 'src/features/import/importAccountSaga'
import WalletPreviewCard from 'src/features/import/WalletPreviewCard'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { ElementName } from 'src/features/telemetry/constants'
import { AccountType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { usePendingAccounts } from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAccountsSaga'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { OnboardingScreens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<OnboardingStackParamList, OnboardingScreens.SelectWallet>

const FALLBACK_ID = 'fallback'
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

  const isImportingAccounts = addresses.length !== IMPORT_WALLET_AMOUNT

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
  }, [allAddressBalances, addresses])

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
    // Remove all pending accounts when navigating back
    const beforeRemoveListener = (): void => {
      dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
    }
    navigation.addListener('beforeRemove', beforeRemoveListener)
    return () => navigation.removeListener('beforeRemove', beforeRemoveListener)
  }, [dispatch, navigation])

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
          dispatch(activateAccount(address))
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
          !showError
            ? t(
                'You can import any of your wallet addresses that are associated with your recovery phrase.'
              )
            : undefined
        }
        title={!showError ? t('Select addresses to import') : ''}>
        {showError ? (
          <BaseCard.ErrorState
            retryButtonLabel={t('Retry')}
            title={t("Couldn't load addresses")}
            onRetry={onRetry}
          />
        ) : isImportingAccounts || loading ? (
          <Flex grow justifyContent="space-between">
            <Loader.Wallets repeat={5} />
          </Flex>
        ) : (
          <ScrollView>
            <Flex gap="sm">
              {initialShownAccounts?.map((portfolio, i) => {
                const { ownerAddress, tokensTotalDenominatedValue } = portfolio
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
        <Box opacity={showError ? 0 : 1}>
          <Button
            disabled={
              isImportingAccounts || loading || !!showError || selectedAddresses.length === 0
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
