import type { NewUserOnboardingWalletHistory } from 'uniswap/src/features/behaviorHistory/newUserOnboarding'
import { OnboardingChecklistStepId } from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import { describe, expect, it } from 'vitest'
import { getOnboardingChecklist } from '~/features/newUserOnboarding/checklist/getOnboardingChecklist'
import type { WebNewUserOnboardingState } from '~/features/newUserOnboarding/useWebNewUserOnboardingState'

const NEW_USER_STATE: WebNewUserOnboardingState = {
  isActive: true,
  isReturningUser: false,
  showOnboardingNudges: true,
  isLoading: false,
  isFunded: false,
  hasSwapped: false,
  hasDismissedGuidedSwap: false,
  isEmbeddedWallet: false,
  hasBackupLogin: undefined,
  showBackupNudge: false,
  address: '0xabc',
  walletHistory: undefined,
}

function getChecklist({
  state,
  walletHistory,
  isHidden = false,
}: {
  state?: Partial<WebNewUserOnboardingState>
  walletHistory?: NewUserOnboardingWalletHistory
  isHidden?: boolean
} = {}): ReturnType<typeof getOnboardingChecklist> {
  return getOnboardingChecklist({
    onboardingState: { ...NEW_USER_STATE, ...state, walletHistory },
    isHidden,
  })
}

describe(getOnboardingChecklist, () => {
  it('gives other wallets 3 steps with account creation already done', () => {
    const checklist = getChecklist()

    expect(checklist.steps).toEqual([
      { id: OnboardingChecklistStepId.CreateAccount, isDone: true },
      { id: OnboardingChecklistStepId.FundWallet, isDone: false },
      { id: OnboardingChecklistStepId.CompleteSwap, isDone: false },
    ])
    expect(checklist.isVisible).toBe(true)
    expect(checklist.completedCount).toBe(1)
  })

  it('adds the backup step for embedded wallets and keeps an unknown status as a to-do', () => {
    const checklist = getChecklist({ state: { isEmbeddedWallet: true, hasBackupLogin: undefined } })

    expect(checklist.steps.map((step) => step.id)).toContain(OnboardingChecklistStepId.AddBackupLogin)
    expect(checklist.steps.at(-1)?.isDone).toBe(false)
  })

  it('hides while loading, on hidden pages, and once completed', () => {
    expect(getChecklist({ state: { isLoading: true, showOnboardingNudges: false } }).isVisible).toBe(false)
    expect(getChecklist({ isHidden: true }).isVisible).toBe(false)
    expect(getChecklist({ walletHistory: { checklistCompleted: true } }).isVisible).toBe(false)
  })

  it('hides once every step is done', () => {
    const fundedAndSwapped = { isReturningUser: true, showOnboardingNudges: false, isFunded: true, hasSwapped: true }

    expect(getChecklist({ state: fundedAndSwapped }).isVisible).toBe(false)
  })

  describe('embedded wallet that funded and swapped', () => {
    const returning = { isReturningUser: true, showOnboardingNudges: false, isFunded: true, hasSwapped: true }

    it('stays up until its backup login is added', () => {
      const backupLeft = getChecklist({
        state: { ...returning, isEmbeddedWallet: true, hasBackupLogin: false, showBackupNudge: true },
      })

      expect(backupLeft.isVisible).toBe(true)
      expect(backupLeft.completedCount).toBe(backupLeft.steps.length - 1)
    })

    it('stays hidden while the backup status is unknown or still loading', () => {
      const unknown = { ...returning, isEmbeddedWallet: true, hasBackupLogin: undefined, showBackupNudge: false }
      const loading = {
        ...returning,
        isEmbeddedWallet: true,
        hasBackupLogin: false,
        showBackupNudge: true,
        isLoading: true,
      }

      expect(getChecklist({ state: unknown }).isVisible).toBe(false)
      expect(getChecklist({ state: loading }).isVisible).toBe(false)
    })
  })

  it('stays hidden when the nudges are off, even if it was seen', () => {
    expect(
      getChecklist({ state: { showOnboardingNudges: false }, walletHistory: { checklistSeen: true } }).isVisible,
    ).toBe(false)
  })
})
