import { useQuery } from '@tanstack/react-query'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ComponentProps, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SelectWalletsSkeleton } from 'src/app/components/loading/SelectWalletSkeleton'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { useSubmitOnEnter } from 'src/app/features/onboarding/utils'
import { Flex, ScrollView, SpinningLoader, Square, Text, Tooltip, TouchableArea } from 'ui/src'
import { WalletFilled } from 'ui/src/components/icons'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { openUri } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'
import WalletPreviewCard from 'wallet/src/components/WalletPreviewCard/WalletPreviewCard'
import { useImportableAccounts } from 'wallet/src/features/onboarding/hooks/useImportableAccounts'
import { useSelectAccounts } from 'wallet/src/features/onboarding/hooks/useSelectAccounts'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'

export function SelectWallets({ flow }: { flow: ExtensionOnboardingFlow }): JSX.Element {
  const { t } = useTranslation()
  const [buttonClicked, setButtonClicked] = useState(false)

  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()
  const { generateAccountsAndImportAddresses, getGeneratedAddresses } = useOnboardingContext()

  const { data: generatedAddresses } = useQuery(
    queryWithoutCache({ queryFn: getGeneratedAddresses, queryKey: [ReactQueryCacheKey.GeneratedAddresses] }),
  )

  const { importableAccounts, isLoading, showError, refetch } = useImportableAccounts(generatedAddresses)

  const { selectedAddresses, toggleAddressSelection } = useSelectAccounts(importableAccounts)

  const smartWalletEnabled = useFeatureFlag(FeatureFlags.SmartWallet)

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

  const belowFrameContent = useMemo(
    () => (smartWalletEnabled ? <SmartWalletTooltip /> : undefined),
    [smartWalletEnabled],
  )

  return (
    <Trace logImpression properties={{ flow }} screen={ExtensionOnboardingScreens.SelectWallet}>
      <OnboardingScreen
        belowFrameContent={belowFrameContent}
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
            ) : isLoading ? (
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

const onPressLearnMore = (uri: string): Promise<void> => openUri({ uri })

function SmartWalletTooltip(): JSX.Element | undefined {
  const { t } = useTranslation()
  const triggerComponent = <CustomTrigger />
  return (
    <Tooltip allowFlip stayInFrame delay={{ close: 100, open: 0 }} placement="top">
      <Flex centered row mx="$spacing60" mt="$spacing8">
        <Text textAlign="center" variant="body4" color="$neutral2">
          <Trans components={{ highlight: triggerComponent }} i18nKey="account.wallet.select.smartWalletDisclaimer" />
        </Text>
      </Flex>
      <Tooltip.Content animationDirection="top" pointerEvents="auto" zIndex={zIndexes.overlay}>
        <Tooltip.Arrow />
        <Flex>
          <Text variant="body4" color="$neutral2">
            {`${t('smartWallet.modal.description.block1')} ${t('smartWallet.modal.description.block2')}`}
          </Text>
          <TouchableArea onPress={() => onPressLearnMore(uniswapUrls.helpArticleUrls.smartWalletDelegation)}>
            <Text variant="buttonLabel4" color="$neutral1" mt="$spacing4">
              {t('common.button.learn')}
            </Text>
          </TouchableArea>
        </Flex>
      </Tooltip.Content>
    </Tooltip>
  )
}

function CustomTrigger(props: ComponentProps<typeof Text>): JSX.Element {
  return (
    <Flex display="inline-flex">
      <Tooltip.Trigger>
        <Text variant="buttonLabel4" color="$neutral1" {...props} cursor="pointer" />
      </Tooltip.Trigger>
    </Flex>
  )
}
