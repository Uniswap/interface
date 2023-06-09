import { Outlet, useLocation } from 'react-router-dom'
import {
  importOnboardingSteps,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Circle, Stack, XStack } from 'ui/src'

export function ImportOnboardingWrapper(): JSX.Element {
  return (
    <>
      <Stack alignItems="center" flexGrow={1} justifyContent="center" width="100%">
        <Outlet />
      </Stack>
      <OnboardingStepIndicator steps={importOnboardingSteps} />
    </>
  )
}

function OnboardingStepIndicator({ steps }: { steps: string[] }): JSX.Element | null {
  if (steps.length === 0) {
    return null
  }

  return (
    <XStack gap="$spacing12" marginBottom="$spacing36">
      {steps.map((step) => (
        <StepCircle
          key={step}
          // TODO: make more generic
          route={`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${step}`}
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
