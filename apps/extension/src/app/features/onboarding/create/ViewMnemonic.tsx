import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MnemonicViewer } from 'src/app/components/MnemonicViewer'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { useSubmitOnEnter } from 'src/app/features/onboarding/utils'
import { BackupWarningBulletPoints } from 'src/app/features/settings/BackupRecoveryPhrase/BackupWarningBulletPoints'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, LabeledCheckbox, Square, Text } from 'ui/src'
import { AlertTriangleFilled, FileListLock } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'

enum ViewStep {
  Info = 0,
  View = 1,
}

export function ViewMnemonic(): JSX.Element {
  const { t } = useTranslation()

  const [viewStep, setViewStep] = useState<ViewStep>(ViewStep.Info)

  const { goToNextStep } = useOnboardingSteps()

  const [disclaimerChecked, setDisclaimerChecked] = useState(false)

  const { getOnboardingAccountAddress, getOnboardingAccountMnemonic, retrieveOnboardingAccountMnemonic } =
    useOnboardingContext()
  const onboardingAccountAddress = getOnboardingAccountAddress()
  const onboardingAccountMnemonic = getOnboardingAccountMnemonic()

  useEffect(() => {
    if (!onboardingAccountMnemonic) {
      retrieveOnboardingAccountMnemonic().catch((e) => {
        logger.error(e, {
          tags: { file: 'ViewMnemonic', function: 'retrieveOnboardingAccountMnemonic' },
        })
      })
    }
  }, [onboardingAccountMnemonic, retrieveOnboardingAccountMnemonic])

  // On Info step, next button should be enabled if mnemonic has been created.
  // On View step, next button should be enabled if disclaimer is checked and mnemonic has been created.
  const shouldEnableNextButton =
    viewStep === ViewStep.View ? !!onboardingAccountAddress && disclaimerChecked : !!onboardingAccountAddress

  const onSubmit = (): void => {
    if (!shouldEnableNextButton) {
      return
    }

    if (viewStep === ViewStep.Info) {
      setViewStep(ViewStep.View)
      return
    }

    if (onboardingAccountAddress && disclaimerChecked) {
      goToNextStep()
    }
  }

  useSubmitOnEnter(onSubmit)

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.New }}
      screen={ExtensionOnboardingScreens.ViewSeedPhrase}
    >
      <OnboardingScreen
        Icon={
          <Square
            alignContent="center"
            backgroundColor={viewStep === ViewStep.View ? '$surface2' : '$statusCritical2'}
            borderRadius="$rounded12"
            size={iconSizes.icon48}
          >
            {viewStep === ViewStep.View ? (
              <FileListLock color="$neutral1" size="$icon.24" />
            ) : (
              <AlertTriangleFilled color="$statusCritical" size="$icon.24" />
            )}
          </Square>
        }
        nextButtonEnabled={shouldEnableNextButton}
        nextButtonText={t('common.button.continue')}
        subtitle={
          viewStep === ViewStep.View
            ? t('onboarding.backup.view.subtitle.message2')
            : t('onboarding.backup.view.subtitle.message1')
        }
        title={t('onboarding.backup.view.title')}
        onBack={(): void =>
          navigate(`/${TopLevelRoutes.Onboarding}`, {
            replace: true,
          })
        }
        onSubmit={onSubmit}
      >
        {viewStep === ViewStep.Info ? (
          <Flex my="$spacing24">
            <BackupWarningBulletPoints />
          </Flex>
        ) : (
          <Flex gap="$spacing16" my="$spacing24" pt="$spacing8" width="100%">
            <MnemonicViewer mnemonic={onboardingAccountMnemonic} />
            <Flex backgroundColor="$surface2" borderRadius="$rounded16" p="$spacing12" overflow="hidden">
              <LabeledCheckbox
                checked={disclaimerChecked}
                text={<Text variant="body3">{t('onboarding.backup.view.disclaimer')}</Text>}
                onCheckPressed={(currentValue: boolean): void => setDisclaimerChecked(!currentValue)}
              />
            </Flex>
          </Flex>
        )}
      </OnboardingScreen>
    </Trace>
  )
}
