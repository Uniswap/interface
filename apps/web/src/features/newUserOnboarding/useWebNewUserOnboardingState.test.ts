import { useFeatureFlag } from '@universe/gating'
import {
  type NewUserOnboardingState,
  useNewUserOnboardingState,
} from 'uniswap/src/features/onboarding/useNewUserOnboardingState'
import { useWebNewUserOnboardingState } from '~/features/newUserOnboarding/useWebNewUserOnboardingState'
import { useEmbeddedWalletBackupStatus } from '~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useEmbeddedWalletBackupStatus'
import { mocked } from '~/test-utils/mocked'
import { renderHook } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))
vi.mock('uniswap/src/features/onboarding/useNewUserOnboardingState')
vi.mock('~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useEmbeddedWalletBackupStatus')

const FUNDED_AND_SWAPPED: NewUserOnboardingState = {
  isActive: true,
  isReturningUser: true,
  showOnboardingNudges: false,
  isLoading: false,
  isFunded: true,
  hasSwapped: true,
  hasDismissedGuidedSwap: false,
}

function renderState({
  isEmbeddedWallet,
  hasBackupLogin,
}: {
  isEmbeddedWallet: boolean
  hasBackupLogin: boolean | undefined
}): ReturnType<typeof useWebNewUserOnboardingState> {
  mocked(useFeatureFlag).mockReturnValue(true)
  mocked(useNewUserOnboardingState).mockReturnValue(FUNDED_AND_SWAPPED)
  mocked(useEmbeddedWalletBackupStatus).mockReturnValue({ isEmbeddedWallet, hasBackupLogin, isLoading: false })
  return renderHook(() => useWebNewUserOnboardingState()).result.current
}

describe(useWebNewUserOnboardingState, () => {
  it.each([false, true, undefined])(
    'treats a funded, swapped embedded wallet as returning whatever its backup login (%s)',
    (hasBackupLogin) => {
      const state = renderState({ isEmbeddedWallet: true, hasBackupLogin })

      expect(state.isReturningUser).toBe(true)
      expect(state.showOnboardingNudges).toBe(false)
    },
  )

  it('still shows the backup nudge to a returning wallet without a backup login', () => {
    expect(renderState({ isEmbeddedWallet: true, hasBackupLogin: false }).showBackupNudge).toBe(true)
  })

  it.each([true, undefined])(
    'hides the backup nudge unless the backup login is confirmed missing (%s)',
    (hasBackupLogin) => {
      expect(renderState({ isEmbeddedWallet: true, hasBackupLogin }).showBackupNudge).toBe(false)
    },
  )
})
