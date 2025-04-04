import { FunctionComponent, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { MnemonicViewer } from 'src/app/components/MnemonicViewer'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { useSubmitOnEnter } from 'src/app/features/onboarding/utils'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Circle, Flex, IconProps, LabeledCheckbox, Square, Text } from 'ui/src'
import { AlertTriangleFilled, EyeOff, FileListLock, Key, PencilDetailed } from 'ui/src/components/icons'
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
            backgroundColor={viewStep === ViewStep.View ? '$surface2' : '$DEP_accentCriticalSoft'}
            borderRadius="$rounded12"
            size={iconSizes.icon48}
          >
            {viewStep === ViewStep.View ? (
              <FileListLock color="$neutral1" size={iconSizes.icon24} />
            ) : (
              <AlertTriangleFilled color="$statusCritical" size={iconSizes.icon24} />
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
          <Flex
            alignItems="flex-start"
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth="$spacing1"
            gap="$spacing24"
            my="$spacing24"
            p="$spacing24"
          >
            <Flex row alignItems="center" gap="$spacing16">
              <WarningIcon Icon={Key} />
              <Text variant="body2">{t('onboarding.backup.view.warning.message1')}</Text>
            </Flex>
            <Flex row alignItems="center" gap="$spacing16">
              <WarningIcon Icon={PencilDetailed} />
              <Text variant="body2">{t('onboarding.backup.view.warning.message2')}</Text>
            </Flex>
            <Flex row alignItems="center" gap="$spacing16">
              <WarningIcon Icon={EyeOff} />
              <Text textAlign="left" variant="body2">
                <Trans
                  components={{ u: <Text textDecorationLine="underline" variant="body2" /> }}
                  i18nKey="onboarding.backup.view.warning.message3"
                />
              </Text>
            </Flex>
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

function WarningIcon({ Icon }: { Icon: FunctionComponent<IconProps> }): JSX.Element {
  return (
    <Circle backgroundColor="$DEP_accentCriticalSoft" size={iconSizes.icon36}>
      <Icon color="$statusCritical" size={iconSizes.icon24} />
    </Circle>
  )
}
