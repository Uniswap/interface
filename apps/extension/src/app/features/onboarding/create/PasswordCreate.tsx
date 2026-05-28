import { ONBOARDING_PANE_TRANSITION_DURATION_WITH_LEEWAY } from 'src/app/features/onboarding/OnboardingPaneAnimatedContents'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { Password } from 'src/app/features/onboarding/Password'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { sleep } from 'utilities/src/time/timing'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'

export function PasswordCreate(): JSX.Element {
  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()
  const { generateOnboardingAccount, resetOnboardingContextData } = useOnboardingContext()

  const onComplete = async (password: string): Promise<void> => {
    resetOnboardingContextData()
    goToNextStep()
    // TODO: EXT-1164 - Move Keyring methods to workers to not block main thread during onboarding
    // start running the validation after going to next step since they clog the main thread with work
    // plus just a bit of extra leeway since animations can take just a tad extra to finish
    await sleep(ONBOARDING_PANE_TRANSITION_DURATION_WITH_LEEWAY)
    await generateOnboardingAccount(password)
  }

  return <Password flow={ExtensionOnboardingFlow.New} onComplete={onComplete} onBack={goToPreviousStep} />
}
