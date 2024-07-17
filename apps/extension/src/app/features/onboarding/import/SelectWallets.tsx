import { useApolloClient } from '@apollo/client'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectWalletsSkeleton } from 'src/app/components/loading/SelectWalletSkeleton'
import { saveDappConnection } from 'src/app/features/dapp/actions'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { Flex, ScrollView, Square, Text } from 'ui/src'
import { WalletFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import {
  SelectWalletScreenDocument,
  SelectWalletScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import WalletPreviewCard from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/onboarding/createImportedAccounts'
import { useSelectAccounts } from 'wallet/src/features/onboarding/hooks/useSelectAccounts'
import { fetchUnitagByAddresses } from 'wallet/src/features/unitags/api'

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

export function SelectWallets({ flow }: { flow: ExtensionOnboardingFlow }): JSX.Element {
  const { t } = useTranslation()
  const shouldAutoConnect = useFeatureFlag(FeatureFlags.ExtensionAutoConnect)

  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()

  const { getImportedAccountsAddresses, selectImportedAccounts } = useOnboardingContext()
  const importedAccountsAddresses = getImportedAccountsAddresses()

  const isImportedAccountsReady = importedAccountsAddresses?.length === NUMBER_OF_WALLETS_TO_IMPORT

  const {
    data: initialShownAccounts,
    isLoading: loading,
    error,
    refetch,
  } = useImportableAccounts(isImportedAccountsReady ? importedAccountsAddresses : undefined)

  const onRetry = useCallback(async () => {
    setIsForcedLoading(true)
    refetch()
  }, [refetch])

  const showError = error && !initialShownAccounts?.length

  const { selectedAddresses, toggleAddressSelection } = useSelectAccounts(initialShownAccounts)

  const onSubmit = useCallback(async () => {
    const importedAccounts = await selectImportedAccounts(selectedAddresses)

    // TODO(EXT-1375): figure out how to better auto connect existing wallets that may have connected via WC or some other method.
    // Once that's solved the feature flag can be turned on/removed.
    if (shouldAutoConnect && importedAccounts[0]) {
      await saveDappConnection(UNISWAP_WEB_URL, importedAccounts[0])
    }

    goToNextStep()
  }, [selectImportedAccounts, selectedAddresses, goToNextStep, shouldAutoConnect])

  // Force a fixed duration loading state for smoother transition (as we show different UI for 1 vs multiple wallets)
  const [isForcedLoading, setIsForcedLoading] = useState(true)
  useTimeout(() => setIsForcedLoading(false), FORCED_LOADING_DURATION)

  const isLoading = loading || isForcedLoading || !isImportedAccountsReady

  const title = showError ? t('onboarding.selectWallets.title.error') : t('onboarding.selectWallets.title.default')

  return (
    <Trace logImpression properties={{ flow }} screen={ExtensionOnboardingScreens.SelectWallet}>
      <OnboardingScreen
        Icon={
          <Square backgroundColor="$surface2" borderRadius="$rounded12" size={iconSizes.icon48}>
            <WalletFilled color="$neutral1" size={iconSizes.icon24} />
          </Square>
        }
        nextButtonEnabled={showError || (isImportedAccountsReady && selectedAddresses.length > 0 && !isLoading)}
        nextButtonText={showError ? t('common.button.retry') : t('common.button.continue')}
        nextButtonTheme={showError ? 'secondary' : 'primary'}
        title={title}
        onBack={goToPreviousStep}
        onSubmit={showError ? onRetry : onSubmit}
      >
        <ScrollView maxHeight="55vh" my="$spacing32" showsVerticalScrollIndicator={false} width="100%">
          <Flex gap="$spacing12" position="relative" py="$spacing4" width="100%">
            {showError ? (
              <Text color="$statusCritical" textAlign="center" variant="buttonLabel2">
                {t('onboarding.selectWallets.error')}
              </Text>
            ) : isLoading ? (
              <Flex>
                <SelectWalletsSkeleton repeat={3} />
              </Flex>
            ) : (
              initialShownAccounts?.map((account) => {
                const { ownerAddress, balance } = account
                return (
                  <WalletPreviewCard
                    key={ownerAddress}
                    address={ownerAddress}
                    balance={balance}
                    selected={selectedAddresses.includes(ownerAddress)}
                    onSelect={toggleAddressSelection}
                  />
                )
              })
            )}
          </Flex>
        </ScrollView>
      </OnboardingScreen>
    </Trace>
  )
}

function useImportableAccounts(addresses?: string[]): {
  isLoading: boolean
  data?: ImportableAccount[]
  error?: Error
  refetch: () => void
} {
  const [refetchCount, setRefetchCount] = useState(0)
  const apolloClient = useApolloClient()

  const refetch = useCallback(() => setRefetchCount((count) => count + 1), [])

  const fetch = useCallback(async (): Promise<ImportableAccount[] | undefined> => {
    if (!addresses) {
      return
    }

    const fetchBalances = apolloClient.query<SelectWalletScreenQuery>({
      query: SelectWalletScreenDocument,
      variables: { ownerAddresses: addresses },
    })

    const fetchUnitags = fetchUnitagByAddresses(addresses)

    const [balancesResponse, unitagsResponse] = await Promise.all([fetchBalances, fetchUnitags])

    const unitagsByAddress = unitagsResponse?.data

    const allAddressBalances = balancesResponse.data.portfolios

    const importableAccounts = allAddressBalances
      ?.map((address) => ({
        ownerAddress: address?.ownerAddress,
        balance: address?.tokensTotalDenominatedValue?.value,
      }))
      .filter(isImportableAccount)

    const accountsWithBalanceOrUnitag: ImportableAccount[] | undefined = importableAccounts?.filter((address) => {
      const hasBalance = Boolean(address.balance && address.balance > 0)
      const hasUnitag = unitagsByAddress?.[address.ownerAddress] !== undefined
      return hasBalance || hasUnitag
    })

    if (accountsWithBalanceOrUnitag?.length) {
      return accountsWithBalanceOrUnitag
    }

    // If all addresses have 0 total token value and no unitags are associated with any of them, show the first address.
    const firstImportableAccount: ImportableAccount | undefined = importableAccounts?.[0]
    if (firstImportableAccount) {
      return [firstImportableAccount]
    }

    // If query for address balances returned no results, show the first address.
    const firstPendingAddress = addresses[0]
    if (firstPendingAddress) {
      return [{ ownerAddress: firstPendingAddress, balance: undefined }]
    }

    throw new Error('No importable accounts found')
    // We use `refetchCount` as a dependency to manually trigger a refetch when calling the `refetch` function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, apolloClient, refetchCount])

  const response = useAsyncData(fetch)

  return useMemo(
    () => ({
      ...response,
      refetch,
    }),
    [refetch, response],
  )
}
