import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { RecoveryPhraseVerification } from 'src/app/features/recoveryPhraseVerification/RecoveryPhraseVerification'
import { NUMBER_OF_TESTS_FOR_RECOVERY_PHRASE_VERIFICATION } from 'src/app/features/settings/BackupRecoveryPhrase/constants'
import { Flex, Square, Text } from 'ui/src'
import { FileListCheck } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { useEvent } from 'utilities/src/react/hooks'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'

export function TestMnemonic({
  numberOfTests = NUMBER_OF_TESTS_FOR_RECOVERY_PHRASE_VERIFICATION,
}: {
  numberOfTests?: number
}): JSX.Element {
  const { t } = useTranslation()

  const { addBackupMethod, getOnboardingAccountAddress, getOnboardingAccountMnemonic } = useOnboardingContext()
  const onboardingAccountAddress = getOnboardingAccountAddress()
  const onboardingAccountMnemonic = getOnboardingAccountMnemonic()

  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()

  const onNext = useEvent((): void => {
    if (!onboardingAccountMnemonic || !onboardingAccountAddress) {
      return
    }

    goToNextStep()
  })

  const [subtitle, setSubtitle] = useState('')
  const [numberOfWordsVerified, setNumberOfWordsVerified] = useState(0)
  const [hasError, setHasError] = useState(false)

  const onComplete = useEvent(() => {
    addBackupMethod(BackupType.Manual)
    goToNextStep()
  })

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.New }}
      screen={ExtensionOnboardingScreens.ConfirmSeedPhrase}
    >
      <OnboardingScreen
        Icon={
          <Square alignSelf="center" backgroundColor="$surface2" borderRadius="$rounded12" size={iconSizes.icon48}>
            <FileListCheck color="$neutral1" size="$icon.24" />
          </Square>
        }
        nextButtonEnabled={false}
        nextButtonText={t('onboarding.backup.manual.progress', {
          completedStepsCount: numberOfWordsVerified,
          totalStepsCount: numberOfTests,
        })}
        nextButtonVariant="default"
        nextButtonEmphasis="secondary"
        subtitle={subtitle}
        title={t('onboarding.backup.manual.title')}
        onBack={goToPreviousStep}
        onSkip={onNext}
        onSubmit={onNext}
      >
        <Flex fill gap="$spacing24" mb="$spacing24" width="100%">
          {onboardingAccountMnemonic ? (
            <RecoveryPhraseVerification
              mnemonic={onboardingAccountMnemonic}
              numberOfTests={numberOfTests}
              onComplete={onComplete}
              setHasError={setHasError}
              setSubtitle={setSubtitle}
              onWordVerified={(numberOfWordsVerified) => setNumberOfWordsVerified(numberOfWordsVerified)}
            />
          ) : null}

          <Text color="$statusCritical" style={{ opacity: hasError ? 1 : 0 }} textAlign="center" variant="body3">
            {t('onboarding.backup.manual.error')}
          </Text>
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}
