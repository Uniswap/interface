import { useContext, useLayoutEffect } from 'react'
import { OnboardingScreenProps } from 'src/app/features/onboarding/OnboardingScreenProps'
import { OnboardingStepsContext } from 'src/app/features/onboarding/OnboardingStepsContext'

export function OnboardingScreen(props: OnboardingScreenProps): null {
  const context = useContext(OnboardingStepsContext)

  useLayoutEffect(() => {
    if (!context) {
      return undefined
    }

    context.setOnboardingScreen(props)
    return () => {
      context.clearOnboardingScreen(props)
    }
  }, [context, props])

  // we hoist it up, see OnboardingSteps + OnboardingScreenFrame
  return null
}
