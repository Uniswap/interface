import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, Square } from 'ui/src'
import { Person } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ClaimUnitagContent } from 'uniswap/src/features/unitags/ClaimUnitagContent'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'

export function ClaimUnitagScreen(): JSX.Element {
  const { t } = useTranslation()
  const { goToNextStep } = useOnboardingSteps()
  const { resetOnboardingContextData, getOnboardingAccountAddress, addUnitagClaim } = useOnboardingContext()
  const onboardingAccountAddress = getOnboardingAccountAddress()

  const onComplete = useCallback(
    (unitag: string) => {
      addUnitagClaim({ username: unitag })
      goToNextStep()
    },
    [goToNextStep, addUnitagClaim],
  )

  const handleBack = useCallback(() => {
    // reset the pending mnemonic when going back from password screen
    // to avoid having them in the context when coming back to either screen
    resetOnboardingContextData()
    navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })
  }, [resetOnboardingContextData])

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.New }}
      screen={ExtensionOnboardingScreens.ClaimUnitag}
    >
      <OnboardingScreen
        Icon={
          <Square backgroundColor="$surface2" borderRadius="$rounded12" size={iconSizes.icon48}>
            <Person color="$neutral1" size="$icon.24" />
          </Square>
        }
        subtitle={t('unitags.onboarding.claim.subtitle')}
        title={t('unitags.onboarding.claim.title.choose')}
        onBack={handleBack}
        onSkip={goToNextStep}
      >
        <Flex gap="$spacing16" pt="$spacing24" width="100%">
          <ClaimUnitagContent
            animateY={false}
            entryPoint={ExtensionOnboardingFlow.New}
            unitagAddress={onboardingAccountAddress}
            onComplete={onComplete}
          />
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}
