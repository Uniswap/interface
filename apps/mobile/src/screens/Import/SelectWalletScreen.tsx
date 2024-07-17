import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { OnboardingScreen } from 'src/features/onboarding/OnboardingScreen'
import { Button, Flex, Loader } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { useSelectWalletScreenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import WalletPreviewCard from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/onboarding/createImportedAccounts'
import { useSelectAccounts } from 'wallet/src/features/onboarding/hooks/useSelectAccounts'

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
  const { getImportedAccountsAddresses, selectImportedAccounts } = useOnboardingContext()
  const importedAccountsAddresses = getImportedAccountsAddresses()

  if (!importedAccountsAddresses) {
    throw new Error('There are no imported accounts addresses available on SelectWalletScreen')
  }

  const isImportingAccounts = importedAccountsAddresses.length !== NUMBER_OF_WALLETS_TO_IMPORT

  const { data, loading, refetch, error } = useSelectWalletScreenQuery({
    variables: { ownerAddresses: importedAccountsAddresses },
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

    const accountsWithBalance = filteredAccounts?.filter((address) => address.balance && address.balance > 0)

    if (accountsWithBalance?.length) {
      return accountsWithBalance
    }

    // if all addresses have 0 total token value, show the first address
    const firstFilteredAccount = filteredAccounts?.[0]
    if (firstFilteredAccount) {
      return [firstFilteredAccount]
    }

    // if query for address balances returned null, show the first address
    const firstPendingAddress = importedAccountsAddresses[0]
    if (firstPendingAddress) {
      return [{ ownerAddress: firstPendingAddress, balance: undefined }]
    }
  }, [importedAccountsAddresses, allAddressBalances])

  const isOnlyOneAccount = initialShownAccounts?.length === 1

  const showError = error && !initialShownAccounts?.length

  const { selectedAddresses, toggleAddressSelection } = useSelectAccounts(initialShownAccounts)

  const onSubmit = useCallback(async () => {
    await selectImportedAccounts(selectedAddresses)

    navigation.navigate({
      name: params?.importType === ImportType.Restore ? OnboardingScreens.Notifications : OnboardingScreens.Backup,
      params,
      merge: true,
    })
  }, [selectImportedAccounts, selectedAddresses, navigation, params])

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
      <OnboardingScreen subtitle={!showError ? subtitle : undefined} title={!showError ? title : ''}>
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
                    testID={`${TestID.WalletCard}-${i + 1}`}
                    onSelect={toggleAddressSelection}
                  />
                )
              })}
            </Flex>
          </ScrollView>
        )}
        <Flex opacity={showError ? 0 : 1}>
          <Button
            disabled={isImportingAccounts || isLoading || !!showError || selectedAddresses.length === 0}
            testID={TestID.Next}
            onPress={onSubmit}
          >
            {t('common.button.continue')}
          </Button>
        </Flex>
      </OnboardingScreen>
    </>
  )
}
