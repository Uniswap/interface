import { useDispatch } from 'react-redux'
import { useOnboardingChecklist } from 'src/components/home/onboardingChecklist/useOnboardingChecklist'
import { renderHook } from 'src/test/test-utils'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { setNewUserOnboardingWalletFlag } from 'uniswap/src/features/behaviorHistory/slice'
import { useNewUserOnboardingState } from 'uniswap/src/features/onboarding/useNewUserOnboardingState'
import { useCanActiveAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanActiveAddressClaimUnitag'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'

const ADDRESS = '0x0000000000000000000000000000000000000001'
const MARK_COMPLETED = setNewUserOnboardingWalletFlag({ address: ADDRESS, flag: 'checklistCompleted' })

vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')),
  useDispatch: vi.fn(),
}))
vi.mock('src/app/navigation/rootNavigation', () => ({ navigate: vi.fn() }))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('uniswap/src/features/onboarding/useNewUserOnboardingState')
vi.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery')
vi.mock('wallet/src/features/unitags/hooks/useCanActiveAddressClaimUnitag')
vi.mock('wallet/src/features/unitags/useUnitagClaimHandler', () => ({
  useUnitagClaimHandler: () => ({ handleClaim: vi.fn(), handleDismiss: vi.fn() }),
}))
vi.mock('wallet/src/features/wallet/hooks', async () => ({
  ...(await vi.importActual('wallet/src/features/wallet/hooks')),
  useActiveAccountWithThrow: () => ({
    type: AccountType.SignerMnemonic,
    address: ADDRESS,
    backups: [BackupType.Manual],
  }),
  useSignerAccounts: () => [],
}))

function setup({
  isEligibilityLoading,
  hasUsername = false,
}: {
  isEligibilityLoading: boolean
  hasUsername?: boolean
}): ReturnType<typeof vi.fn> {
  const dispatch = vi.fn()
  vi.mocked(useDispatch).mockReturnValue(dispatch)
  // A wallet that saw the checklist and has every required step done, before eligibility is known
  vi.mocked(useNewUserOnboardingState).mockReturnValue({
    address: ADDRESS,
    walletHistory: { checklistSeen: true },
    isActive: true,
    isReturningUser: false,
    showOnboardingNudges: false,
    isLoading: false,
    isFunded: true,
    hasSwapped: true,
    hasDismissedGuidedSwap: false,
  })
  vi.mocked(useCanActiveAddressClaimUnitag).mockReturnValue({
    canClaimUnitag: !isEligibilityLoading,
    isLoading: isEligibilityLoading,
  })
  vi.mocked(useUnitagsAddressQuery).mockReturnValue({
    data: hasUsername ? { username: 'alice' } : undefined,
    isLoading: false,
  } as unknown as ReturnType<typeof useUnitagsAddressQuery>)
  return dispatch
}

describe('useOnboardingChecklist completion', () => {
  it('waits for username eligibility before marking the checklist completed', () => {
    const dispatch = setup({ isEligibilityLoading: true })
    const { result } = renderHook(() => useOnboardingChecklist())

    expect(result.current.isLoading).toBe(true)
    expect(dispatch).not.toHaveBeenCalledWith(MARK_COMPLETED)
  })

  it('leaves an eligible wallet on the optional username step once eligibility resolves', () => {
    const dispatch = setup({ isEligibilityLoading: false })
    const { result } = renderHook(() => useOnboardingChecklist())

    expect(result.current.isVisible).toBe(true)
    expect(dispatch).not.toHaveBeenCalledWith(MARK_COMPLETED)
  })

  it('marks the checklist completed once every step, username included, is done', () => {
    const dispatch = setup({ isEligibilityLoading: false, hasUsername: true })
    renderHook(() => useOnboardingChecklist())

    expect(dispatch).toHaveBeenCalledWith(MARK_COMPLETED)
  })
})
