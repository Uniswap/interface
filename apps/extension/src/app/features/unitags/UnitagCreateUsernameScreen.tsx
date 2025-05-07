import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { useUnitagClaimContext } from 'src/app/features/unitags/UnitagClaimContext'
import { Flex, Square } from 'ui/src'
import { Person } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ClaimUnitagContent, ClaimUnitagContentProps } from 'uniswap/src/features/unitags/ClaimUnitagContent'
import { ExtensionScreens, ExtensionUnitagClaimScreens } from 'uniswap/src/types/screens/extension'
import { useAccountAddressFromUrlWithThrow } from 'wallet/src/features/wallet/hooks'

type onNavigateContinueType = Exclude<ClaimUnitagContentProps['onNavigateContinue'], undefined>

export function UnitagCreateUsernameScreen(): JSX.Element {
  const { t } = useTranslation()
  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()
  const { setUnitag, setEntryPoint } = useUnitagClaimContext()
  const address = useAccountAddressFromUrlWithThrow()

  const onNavigateContinue = useCallback(
    ({ unitag, entryPoint }: Parameters<onNavigateContinueType>[0]) => {
      setUnitag(unitag)
      setEntryPoint(entryPoint)

      goToNextStep()
    },
    [goToNextStep, setEntryPoint, setUnitag],
  )

  return (
    <Trace logImpression screen={ExtensionUnitagClaimScreens.CreateUsername}>
      <OnboardingScreen
        Icon={
          <Square
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            height={iconSizes.icon48}
            width={iconSizes.icon48}
          >
            <Person color="$neutral1" size="$icon.24" />
          </Square>
        }
        title={t('unitags.onboarding.claim.title.choose')}
        subtitle={t('unitags.onboarding.claim.subtitle')}
        onBack={goToPreviousStep}
      >
        <Flex gap="$spacing24" pt="$spacing24" width="100%">
          <ClaimUnitagContent
            animateY={false}
            unitagAddress={address}
            entryPoint={ExtensionScreens.Home}
            onNavigateContinue={onNavigateContinue}
          />
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}
