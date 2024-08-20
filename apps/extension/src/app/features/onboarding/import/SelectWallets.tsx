import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectWalletsSkeleton } from 'src/app/components/loading/SelectWalletSkeleton'
import { saveDappConnection } from 'src/app/features/dapp/actions'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { Flex, ScrollView, Square, Text } from 'ui/src'
import { WalletFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import WalletPreviewCard from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { useImportableAccounts } from 'wallet/src/features/onboarding/hooks/useImportableAccounts'
import { useSelectAccounts } from 'wallet/src/features/onboarding/hooks/useSelectAccounts'

export function SelectWallets({ flow }: { flow: ExtensionOnboardingFlow }): JSX.Element {
  const { t } = useTranslation()
  const shouldAutoConnect = useFeatureFlag(FeatureFlags.ExtensionAutoConnect)

  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()
  const { selectImportedAccounts } = useOnboardingContext()

  const { importableAccounts, isLoading, showError, refetch } = useImportableAccounts()

  const { selectedAddresses, toggleAddressSelection } = useSelectAccounts(importableAccounts)

  const onSubmit = useCallback(async () => {
    const importedAccounts = await selectImportedAccounts(selectedAddresses)

    // TODO(EXT-1375): figure out how to better auto connect existing wallets that may have connected via WC or some other method.
    // Once that's solved the feature flag can be turned on/removed.
    if (shouldAutoConnect && importedAccounts[0]) {
      await saveDappConnection(UNISWAP_WEB_URL, importedAccounts[0])
    }

    goToNextStep()
  }, [selectImportedAccounts, selectedAddresses, goToNextStep, shouldAutoConnect])

  const title = showError ? t('onboarding.selectWallets.title.error') : t('onboarding.selectWallets.title.default')

  return (
    <Trace logImpression properties={{ flow }} screen={ExtensionOnboardingScreens.SelectWallet}>
      <OnboardingScreen
        Icon={
          <Square backgroundColor="$surface2" borderRadius="$rounded12" size={iconSizes.icon48}>
            <WalletFilled color="$neutral1" size={iconSizes.icon24} />
          </Square>
        }
        nextButtonEnabled={showError || (selectedAddresses.length > 0 && !isLoading)}
        nextButtonText={showError ? t('common.button.retry') : t('common.button.continue')}
        nextButtonTheme={showError ? 'secondary' : 'primary'}
        title={title}
        onBack={goToPreviousStep}
        onSubmit={showError ? refetch : onSubmit}
      >
        <ScrollView
          maxHeight="55vh"
          my="$spacing32"
          overflow="visible"
          showsVerticalScrollIndicator={false}
          width="100%"
        >
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
              importableAccounts?.map((account) => {
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
