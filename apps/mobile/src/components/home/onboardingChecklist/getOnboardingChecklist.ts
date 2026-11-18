import type { NewUserOnboardingWalletHistory } from 'uniswap/src/features/behaviorHistory/newUserOnboarding'
import {
  buildOnboardingChecklist,
  type OnboardingChecklist,
  type OnboardingChecklistStep,
  OnboardingChecklistStepId,
} from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import type { NewUserOnboardingState } from 'uniswap/src/features/onboarding/useNewUserOnboardingState'

export interface MobileOnboardingChecklist extends OnboardingChecklist {
  isDismissible: boolean
  /** Steps can still appear (username eligibility), so neither completion nor the intro cards should act yet. */
  isLoading: boolean
}

export function getOnboardingChecklist({
  onboardingState,
  walletHistory,
  isSignerAccount,
  hasSwappedOnAnyWallet,
  hasBackup,
  hasUsername,
  canClaimUsername,
  isUsernameLoading,
}: {
  onboardingState: NewUserOnboardingState
  walletHistory: NewUserOnboardingWalletHistory | undefined
  isSignerAccount: boolean
  hasSwappedOnAnyWallet: boolean
  hasBackup: boolean
  hasUsername: boolean
  canClaimUsername: boolean
  isUsernameLoading: boolean
}): MobileOnboardingChecklist {
  const { isActive, isLoading, isFunded } = onboardingState
  const hasSwapped = onboardingState.hasSwapped || hasSwappedOnAnyWallet

  const steps: OnboardingChecklistStep[] = [
    { id: OnboardingChecklistStepId.CreateAccount, isDone: true },
    { id: OnboardingChecklistStepId.FundWallet, isDone: isFunded },
    { id: OnboardingChecklistStepId.BackupWallet, isDone: hasBackup },
    { id: OnboardingChecklistStepId.CompleteSwap, isDone: hasSwapped },
  ]
  // A wallet that can't claim one (e.g. the device already did) skips the step rather than see it stuck
  if (hasUsername || canClaimUsername) {
    steps.push({ id: OnboardingChecklistStepId.ClaimUsername, isDone: hasUsername, isOptional: true })
  }

  const hasDoneRequiredSteps = steps.every((step) => step.isDone || step.isOptional)
  // A wallet that saw the checklist keeps it for the optional step; one that arrived with every
  // required step done is a returning user and never sees it
  const isReturningUser = hasDoneRequiredSteps && !walletHistory?.checklistSeen
  const isChecklistLoading = isLoading || isUsernameLoading
  const showOnboardingNudges = isActive && isSignerAccount && !isChecklistLoading && !isReturningUser

  return {
    ...buildOnboardingChecklist({
      steps,
      showOnboardingNudges,
      wasCompleted: !!walletHistory?.checklistCompleted,
    }),
    isDismissible: hasDoneRequiredSteps,
    isLoading: isChecklistLoading,
  }
}
