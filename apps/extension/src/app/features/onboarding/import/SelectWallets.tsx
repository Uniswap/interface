import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectWalletsSkeleton } from 'src/app/components/loading/SelectWalletSkeleton'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { useSubmitOnEnter } from 'src/app/features/onboarding/utils'
import { Flex, ScrollView, SpinningLoader, Square, Text } from 'ui/src'
import { WalletFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { useAsyncData, useEvent } from 'utilities/src/react/hooks'
import WalletPreviewCard from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { useImportableAccounts } from 'wallet/src/features/onboarding/hooks/useImportableAccounts'
import { useSelectAccounts } from 'wallet/src/features/onboarding/hooks/useSelectAccounts'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'

export function SelectWallets({ flow }: { flow: ExtensionOnboardingFlow }): JSX.Element {
  const { t } = useTranslation()
  const [buttonClicked, setButtonClicked] = useState(false)

  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()
  const { generateAccountsAndImportAddresses, getGeneratedAddresses } = useOnboardingContext()

  const { data: generatedAddresses } = useAsyncData(getGeneratedAddresses)

  const { importableAccounts, isLoading, showError, refetch } = useImportableAccounts(generatedAddresses)

  const { selectedAddresses, toggleAddressSelection } = useSelectAccounts(importableAccounts)

  const enableSubmit = showError || (selectedAddresses.length > 0 && !isLoading)

  const onSubmit = useEvent(async () => {
    if (!enableSubmit) {
      return
    }

    setButtonClicked(true)
    await generateAccountsAndImportAddresses({
      selectedAddresses,
      backupType: flow === ExtensionOnboardingFlow.Passkey ? BackupType.Passkey : BackupType.Manual,
    })

    goToNextStep()
    setButtonClicked(false)
  })

  const title = showError ? t('onboarding.selectWallets.title.error') : t('onboarding.selectWallets.title.default')

  useSubmitOnEnter(showError ? refetch : onSubmit)

  return (
    <Trace logImpression properties={{ flow }} screen={ExtensionOnboardingScreens.SelectWallet}>
      <OnboardingScreen
        Icon={
          <Square backgroundColor="$surface2" borderRadius="$rounded12" size={iconSizes.icon48}>
            <WalletFilled color="$neutral1" size="$icon.24" />
          </Square>
        }
        nextButtonEnabled={enableSubmit}
        nextButtonIcon={buttonClicked ? <SpinningLoader color="$accent1" size={iconSizes.icon20} /> : undefined}
        nextButtonText={
          showError
            ? t('common.button.retry')
            : buttonClicked
              ? t('onboarding.importMnemonic.button.importing')
              : t('common.button.continue')
        }
        nextButtonVariant={showError ? 'default' : 'branded'}
        nextButtonEmphasis={showError || buttonClicked ? 'secondary' : 'primary'}
        title={title}
        onBack={goToPreviousStep}
        onSubmit={showError ? refetch : onSubmit}
      >
        <ScrollView maxHeight="55vh" my="$spacing32" showsVerticalScrollIndicator={false} width="100%">
          <Flex gap="$spacing12" position="relative" py="$spacing4" width="100%">
            {showError ? (
              <Text color="$statusCritical" textAlign="center" variant="buttonLabel2">
                {t('onboarding.selectWallets.error')}
              </Text>
            ) : !importableAccounts?.length ? (
              <Flex>
                <SelectWalletsSkeleton repeat={3} />
              </Flex>
            ) : (
              importableAccounts?.map((account) => {
                const { address, balance } = account
                return (
                  <WalletPreviewCard
                    key={address}
                    address={address}
                    balance={balance}
                    selected={selectedAddresses.includes(address)}
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
