import { Flex, styled } from 'ui/src'

const SINGLE_PANE_DURATION = 200

// TODO: EXT-1164 - Move Keyring methods to workers to not block main thread during onboarding
// if exitBeforeEnter is set in the <OnboardingSteps /> AnimatePresence we are
// running two 200ms animations sequentially - first to exit, then enter so we
// double this constant. if we change that, needs to change here
const ONBOARDING_PANE_TRANSITION_DURATION = SINGLE_PANE_DURATION * 2
export const ONBOARDING_PANE_TRANSITION_DURATION_WITH_LEEWAY = ONBOARDING_PANE_TRANSITION_DURATION + 200

export const OnboardingPaneAnimatedContents = styled(Flex, {
  animation: `${SINGLE_PANE_DURATION}ms`,
  width: '100%',

  zIndex: 1,
  x: 0,
  opacity: 1,
  mx: 'auto',
})
