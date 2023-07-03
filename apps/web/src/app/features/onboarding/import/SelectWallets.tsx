import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import WalletPreviewCard, { LoadingWalletPreviewCard } from 'src/app/components/WalletPreviewCard'
import { ONBOARDING_CONTENT_WIDTH } from 'src/app/features/onboarding/utils'
import {
  ImportOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { useAppDispatch } from 'src/background/store'
import { ScrollView, Stack, Text, XStack, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { EMPTY_ARRAY } from 'wallet/src/constants/misc'
import { useSelectWalletScreenQuery } from 'wallet/src/data/__generated__/types-and-hooks'
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
import { ONE_SECOND_MS } from 'wallet/src/utils/time'
import { useTimeout } from 'wallet/src/utils/timing'

const FALLBACK_ID = 'fallback'
const FORCED_LOADING_DURATION = 3 * ONE_SECOND_MS // 3s

export function SelectWallets(): JSX.Element {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const pendingAccounts = usePendingAccounts()
  const addresses = Object.values(pendingAccounts)
    .filter((a) => a.type === AccountType.SignerMnemonic)
    .sort(
      (a, b) =>
        (a as SignerMnemonicAccount).derivationIndex - (b as SignerMnemonicAccount).derivationIndex
    )
    .map((account) => account.address)

  const isImportingAccounts = addresses.length !== NUMBER_OF_WALLETS_TO_IMPORT

  const {
    data,
    loading,
    // TODO: add error state with refetch
    // refetch,
    error,
  } = useSelectWalletScreenQuery({
    variables: { ownerAddresses: addresses },
    /*
     * Wait until all the addresses have been added to the store before querying.
     * Also prevents an extra API call when user navigates back and clears pending accounts.
     */
    skip: isImportingAccounts,
  })

  // TODO: add error state with retry
  // const onRetry = useCallback(() => refetch(), [refetch])

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

  const onPress = (address: string): void => {
    if (initialShownAccounts?.length === 1 && selectedAddresses.length === 1) return
    setSelectedAddresses(address)
  }

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

  const isFirstAccountActive = useRef(false) // to keep track of first account activated from the selected accounts
  const onSubmit = useCallback(() => {
    addresses.forEach((address) => {
      // Remove unselected accounts from store.
      if (!selectedAddresses.includes(address)) {
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.Remove,
            address,
            // notificationsEnabled: !!pendingAccounts[address]?.pushNotificationsEnabled,
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
              newName: `Wallet ${account.derivationIndex + 1}`,
            })
          )
        }
      }
    })
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Activate))
    navigate(
      `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Complete}`
    )
  }, [addresses, navigate, selectedAddresses, dispatch, pendingAccounts])

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
    : t(
        'You can import any of your wallet addresses that are associated with your recovery phrase.'
      )

  return (
    <Stack alignItems="center" gap="$spacing36" width={ONBOARDING_CONTENT_WIDTH}>
      <YStack alignItems="center" gap="$spacing8">
        <Text variant="headlineMedium">{title}</Text>
        <Text variant="subheadSmall">{subtitle}</Text>
      </YStack>
      <ScrollView height={180} showsVerticalScrollIndicator={false} width="100%">
        {isLoading ? (
          <YStack gap="$spacing12">
            <LoadingWalletPreviewCard />
            <LoadingWalletPreviewCard />
          </YStack>
        ) : (
          <YStack gap="$spacing12" position="relative" width="100%">
            {initialShownAccounts.map((portfolio) => {
              const { ownerAddress, tokensTotalDenominatedValue } = portfolio
              return (
                <WalletPreviewCard
                  key={ownerAddress}
                  address={ownerAddress}
                  balance={tokensTotalDenominatedValue?.value}
                  hideSelectionCircle={isOnlyOneAccount}
                  selected={selectedAddresses.includes(ownerAddress)}
                  onSelect={onPress}
                />
              )
            })}
          </YStack>
        )}
      </ScrollView>
      <XStack gap="$spacing12" width="100%">
        <Button flexGrow={1} theme="secondary" onPress={(): void => navigate(-1)}>
          Back
        </Button>
        <Button
          disabled={
            isImportingAccounts || isLoading || !!showError || selectedAddresses.length === 0
          }
          flexGrow={1}
          theme="primary"
          onPress={onSubmit}>
          Finish
        </Button>
      </XStack>
    </Stack>
  )
}
