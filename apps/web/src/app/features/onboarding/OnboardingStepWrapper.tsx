import { Outlet, useLocation } from 'react-router-dom'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { Circle, Stack, XStack } from 'ui/src'

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
    <XStack gap="$spacing12" marginBottom="$spacing36">
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

  return <Circle backgroundColor={active ? '$textPrimary' : '$background3'} size={10} />
}
