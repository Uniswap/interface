export enum OnboardingChecklistStepId {
  CreateAccount = 'create_account',
  FundWallet = 'fund_wallet',
  CompleteSwap = 'complete_swap',
  AddBackupLogin = 'add_backup_login',
  BackupWallet = 'backup_wallet',
  ClaimUsername = 'claim_username',
}

export interface OnboardingChecklistStep {
  id: OnboardingChecklistStepId
  isDone: boolean
  isOptional?: boolean
}

export interface OnboardingChecklist {
  isVisible: boolean
  steps: OnboardingChecklistStep[]
  completedCount: number
  isComplete: boolean
}

export function buildOnboardingChecklist({
  steps,
  showOnboardingNudges,
  wasCompleted,
}: {
  steps: OnboardingChecklistStep[]
  showOnboardingNudges: boolean
  wasCompleted: boolean
}): OnboardingChecklist {
  const completedCount = steps.filter((step) => step.isDone).length
  const isComplete = completedCount === steps.length

  return {
    isVisible: showOnboardingNudges && !isComplete && !wasCompleted,
    steps,
    completedCount,
    isComplete,
  }
}
