import {
  buildOnboardingChecklist,
  type OnboardingChecklist,
  type OnboardingChecklistStep,
  OnboardingChecklistStepId,
} from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import type { WebNewUserOnboardingState } from '~/features/newUserOnboarding/useWebNewUserOnboardingState'

export function getOnboardingChecklist({
  onboardingState,
  isHidden,
}: {
  onboardingState: WebNewUserOnboardingState
  isHidden: boolean
}): OnboardingChecklist {
  const {
    isActive,
    isLoading,
    showOnboardingNudges,
    showBackupNudge,
    isFunded,
    hasSwapped,
    isEmbeddedWallet,
    hasBackupLogin,
    walletHistory,
  } = onboardingState

  const steps: OnboardingChecklistStep[] = [
    { id: OnboardingChecklistStepId.CreateAccount, isDone: true },
    { id: OnboardingChecklistStepId.FundWallet, isDone: isFunded },
    { id: OnboardingChecklistStepId.CompleteSwap, isDone: hasSwapped },
  ]
  if (isEmbeddedWallet) {
    steps.push({ id: OnboardingChecklistStepId.AddBackupLogin, isDone: hasBackupLogin === true })
  }

  // The nudges turn off once a wallet is funded and swapped, but an embedded wallet may still owe a
  // backup login. Both inputs are only true once confirmed, so a failed read keeps the card hidden.
  const hasStepLeft = showOnboardingNudges || (isActive && !isLoading && showBackupNudge)

  return buildOnboardingChecklist({
    steps,
    showOnboardingNudges: hasStepLeft && !isHidden,
    wasCompleted: !!walletHistory?.checklistCompleted,
  })
}
