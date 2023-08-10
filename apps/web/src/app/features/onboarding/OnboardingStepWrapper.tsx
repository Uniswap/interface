import { Outlet, useLocation } from 'react-router-dom'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { Circle, getTokenValue, Icons, Stack, XStack } from 'ui/src'

type OnboardingStepsProps = {
  methodRoute?: string
  steps: string[]
}

export function OnboardingStepWrapper({ steps, methodRoute }: OnboardingStepsProps): JSX.Element {
  return (
    <>
      <Stack alignItems="center" flexGrow={1} justifyContent="center" width="100%">
        <Outlet />
      </Stack>
      <OnboardingStepIndicator methodRoute={methodRoute} steps={steps} />
    </>
  )
}

function OnboardingStepIndicator({ steps, methodRoute }: OnboardingStepsProps): JSX.Element | null {
  if (steps.length === 0) {
    return null
  }

  return (
    <XStack alignItems="center" gap="$spacing12" justifyContent="center" marginBottom="$spacing36">
      {steps.map((step) => (
        <StepCircle
          key={step}
          route={methodRoute ? `/${TopLevelRoutes.Onboarding}/${methodRoute}/${step}` : ''}
        />
      ))}
    </XStack>
  )
}

function StepCircle({ route }: { route: string }): JSX.Element {
  const { pathname } = useLocation()

  const active = pathname === route

  if (!active) {
    return <Circle backgroundColor="$neutral3" size={getTokenValue('$icon.8')} />
  }

  return <Icons.Sparkle color="$neutral1" size={getTokenValue('$icon.16')} />
}
