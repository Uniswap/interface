import type { GeneratedIcon } from '@universe/mycelium/icons'
import { CreditCard } from '@universe/mycelium/icons/CreditCard'
import { Person } from '@universe/mycelium/icons/Person'
import { Shield } from '@universe/mycelium/icons/Shield'
import { SwapCoin } from '@universe/mycelium/icons/SwapCoin'
import type { TFunction } from 'i18next'
import { OnboardingChecklistStepId } from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'

interface StepContent {
  title: string
  card?: { description: string; Icon: GeneratedIcon }
}

export function getOnboardingChecklistStepContent(t: TFunction, stepId: OnboardingChecklistStepId): StepContent {
  const content: Record<OnboardingChecklistStepId, StepContent> = {
    [OnboardingChecklistStepId.CreateAccount]: { title: t('onboarding.checklist.step.createAccount') },
    [OnboardingChecklistStepId.FundWallet]: {
      title: t('onboarding.checklist.step.addFunds'),
      card: { description: t('onboarding.checklist.card.addFunds.description'), Icon: CreditCard },
    },
    [OnboardingChecklistStepId.BackupWallet]: {
      title: t('onboarding.checklist.step.backupWallet'),
      card: { description: t('onboarding.checklist.card.backupWallet.description'), Icon: Shield },
    },
    [OnboardingChecklistStepId.CompleteSwap]: {
      title: t('onboarding.checklist.step.completeSwap'),
      card: { description: t('onboarding.checklist.card.completeSwap.description'), Icon: SwapCoin },
    },
    [OnboardingChecklistStepId.ClaimUsername]: {
      title: t('onboarding.checklist.step.claimUsername'),
      card: { description: t('onboarding.checklist.card.claimUsername.description'), Icon: Person },
    },
    // Web-only step
    [OnboardingChecklistStepId.AddBackupLogin]: { title: t('onboarding.checklist.step.addBackupLogin') },
  }
  return content[stepId]
}
