import { getOnboardingChecklist } from 'src/components/home/onboardingChecklist/getOnboardingChecklist'
import type { NewUserOnboardingWalletHistory } from 'uniswap/src/features/behaviorHistory/newUserOnboarding'
import { OnboardingChecklistStepId } from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import type { NewUserOnboardingState } from 'uniswap/src/features/onboarding/useNewUserOnboardingState'

const NEW_USER_STATE: NewUserOnboardingState = {
  isActive: true,
  isReturningUser: false,
  showOnboardingNudges: true,
  isLoading: false,
  isFunded: false,
  hasSwapped: false,
  hasDismissedGuidedSwap: false,
}

type Input = Parameters<typeof getOnboardingChecklist>[0]

function getChecklist({
  state,
  walletHistory,
  ...overrides
}: Partial<Omit<Input, 'onboardingState'>> & {
  state?: Partial<NewUserOnboardingState>
  walletHistory?: NewUserOnboardingWalletHistory
} = {}): ReturnType<typeof getOnboardingChecklist> {
  return getOnboardingChecklist({
    onboardingState: { ...NEW_USER_STATE, ...state },
    walletHistory,
    isSignerAccount: true,
    hasSwappedOnAnyWallet: false,
    hasBackup: false,
    hasUsername: false,
    canClaimUsername: true,
    isUsernameLoading: false,
    ...overrides,
  })
}

const ALL_REQUIRED_DONE = { state: { isFunded: true, hasSwapped: true }, hasBackup: true }

describe(getOnboardingChecklist, () => {
  it('lists the required steps in order, then the optional username step', () => {
    const checklist = getChecklist()

    expect(checklist.steps).toEqual([
      { id: OnboardingChecklistStepId.CreateAccount, isDone: true },
      { id: OnboardingChecklistStepId.FundWallet, isDone: false },
      { id: OnboardingChecklistStepId.BackupWallet, isDone: false },
      { id: OnboardingChecklistStepId.CompleteSwap, isDone: false },
      { id: OnboardingChecklistStepId.ClaimUsername, isDone: false, isOptional: true },
    ])
    expect(checklist.isVisible).toBe(true)
    expect(checklist.isDismissible).toBe(false)
  })

  it('shows the username step as done once the wallet has one, and leaves it out when none can be claimed', () => {
    const claimed = getChecklist({ hasUsername: true, canClaimUsername: false })
    expect(claimed.steps.at(-1)).toEqual({
      id: OnboardingChecklistStepId.ClaimUsername,
      isDone: true,
      isOptional: true,
    })

    const ineligible = getChecklist({ canClaimUsername: false })
    expect(ineligible.steps.map((step) => step.id)).not.toContain(OnboardingChecklistStepId.ClaimUsername)
  })

  it('hides while onboarding or username state loads, and for view-only accounts', () => {
    const onboardingLoading = getChecklist({ state: { isLoading: true } })
    const usernameLoading = getChecklist({ isUsernameLoading: true })
    const viewOnly = getChecklist({ isSignerAccount: false })

    expect(onboardingLoading).toMatchObject({ isVisible: false, isLoading: true })
    expect(usernameLoading).toMatchObject({ isVisible: false, isLoading: true })
    expect(viewOnly).toMatchObject({ isVisible: false, isLoading: false })
  })

  it('counts a swap from another wallet on the account', () => {
    const swapStep = getChecklist({ hasSwappedOnAnyWallet: true }).steps.find(
      (step) => step.id === OnboardingChecklistStepId.CompleteSwap,
    )

    expect(swapStep?.isDone).toBe(true)
  })

  it('stays up without a backup even after funding and swapping', () => {
    expect(getChecklist({ state: { isFunded: true, hasSwapped: true } }).isVisible).toBe(true)
  })

  it('becomes dismissible once only the username step is left, for a wallet that saw it', () => {
    const checklist = getChecklist({ ...ALL_REQUIRED_DONE, walletHistory: { checklistSeen: true } })

    expect(checklist.isVisible).toBe(true)
    expect(checklist.isDismissible).toBe(true)
    expect(checklist.isComplete).toBe(false)
  })

  it('never shows to a wallet that arrived with every required step done', () => {
    expect(getChecklist(ALL_REQUIRED_DONE).isVisible).toBe(false)
  })

  it('hides once dismissed or every step is done', () => {
    const seen = { checklistSeen: true }

    expect(getChecklist({ ...ALL_REQUIRED_DONE, walletHistory: { ...seen, checklistCompleted: true } }).isVisible).toBe(
      false,
    )
    expect(getChecklist({ ...ALL_REQUIRED_DONE, hasUsername: true, walletHistory: seen }).isComplete).toBe(true)
    expect(getChecklist({ ...ALL_REQUIRED_DONE, hasUsername: true, walletHistory: seen }).isVisible).toBe(false)
  })
})
