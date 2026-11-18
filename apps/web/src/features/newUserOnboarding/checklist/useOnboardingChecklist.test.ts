import { ContentStyle, type InAppNotification } from '@universe/api'
import { useDispatch } from 'react-redux'
import { OnboardingChecklistStepId } from 'uniswap/src/features/onboarding/checklist/onboardingChecklist'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useOnboardingChecklist } from '~/features/newUserOnboarding/checklist/useOnboardingChecklist'
import { useWebNewUserOnboardingState } from '~/features/newUserOnboarding/useWebNewUserOnboardingState'
import { useCheckHasBackupLogin } from '~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useEmbeddedWalletBackupStatus'
import { useNotificationStore } from '~/notification-service/notification-renderer/notificationStore'
import { setOpenModal } from '~/state/application/reducer'
import { mocked } from '~/test-utils/mocked'
import { act, renderHook } from '~/test-utils/render'

vi.mock('react-redux', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-redux')>()),
  useDispatch: vi.fn(),
}))
vi.mock('~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useEmbeddedWalletBackupStatus')
vi.mock('~/features/newUserOnboarding/useWebNewUserOnboardingState')
vi.mock('~/hooks/useIsPage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/hooks/useIsPage')>()),
  useIsPage: () => false,
}))

const OPEN_BACKUP_MODAL = setOpenModal({ name: ModalName.AddBackupLogin })
const SYSTEM_BANNER = { id: 'outage', content: { style: ContentStyle.SYSTEM_BANNER } } as InAppNotification

function setup({
  hasBackupLogin,
  checkHasBackupLogin = vi.fn(),
}: {
  hasBackupLogin: boolean | undefined
  checkHasBackupLogin?: () => Promise<boolean | undefined>
}): { dispatch: ReturnType<typeof vi.fn>; checkHasBackupLogin: () => Promise<boolean | undefined> } {
  const dispatch = vi.fn()
  mocked(useDispatch).mockReturnValue(dispatch)
  mocked(useCheckHasBackupLogin).mockReturnValue(checkHasBackupLogin)
  mocked(useWebNewUserOnboardingState).mockReturnValue({
    isActive: true,
    isReturningUser: false,
    showOnboardingNudges: true,
    isLoading: false,
    isFunded: true,
    hasSwapped: true,
    hasDismissedGuidedSwap: false,
    isEmbeddedWallet: true,
    hasBackupLogin,
    showBackupNudge: hasBackupLogin === false,
    address: '0xabc',
    walletHistory: { checklistSeen: true },
  })
  return { dispatch, checkHasBackupLogin }
}

async function pressBackupStep(): Promise<void> {
  const { result } = renderHook(() => useOnboardingChecklist({ isMobile: false }))
  await act(async () => {
    result.current.onStepPress(OnboardingChecklistStepId.AddBackupLogin)
  })
}

describe('useOnboardingChecklist visibility', () => {
  afterEach(() => {
    act(() => useNotificationStore.setState({ activeNotifications: [] }))
  })

  it('yields while a system banner is active', () => {
    setup({ hasBackupLogin: false })
    const { result } = renderHook(() => useOnboardingChecklist({ isMobile: false }))
    expect(result.current.isVisible).toBe(true)

    act(() => useNotificationStore.setState({ activeNotifications: [SYSTEM_BANNER] }))
    expect(result.current.isVisible).toBe(false)

    act(() => useNotificationStore.setState({ activeNotifications: [] }))
    expect(result.current.isVisible).toBe(true)
  })
})

describe('useOnboardingChecklist backup login step', () => {
  it('opens the modal without a check when the status is already known', async () => {
    const { dispatch, checkHasBackupLogin } = setup({ hasBackupLogin: false })
    await pressBackupStep()

    expect(checkHasBackupLogin).not.toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith(OPEN_BACKUP_MODAL)
  })

  it('checks an unknown status first and skips the modal when a backup exists', async () => {
    const { dispatch, checkHasBackupLogin } = setup({
      hasBackupLogin: undefined,
      checkHasBackupLogin: vi.fn().mockResolvedValue(true),
    })
    await pressBackupStep()

    expect(checkHasBackupLogin).toHaveBeenCalledTimes(1)
    expect(dispatch).not.toHaveBeenCalledWith(OPEN_BACKUP_MODAL)
  })

  it('opens the modal after the check finds no backup', async () => {
    const { dispatch } = setup({
      hasBackupLogin: undefined,
      checkHasBackupLogin: vi.fn().mockResolvedValue(false),
    })
    await pressBackupStep()

    expect(dispatch).toHaveBeenCalledWith(OPEN_BACKUP_MODAL)
  })

  it('leaves the step to retry when the check fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { dispatch } = setup({
      hasBackupLogin: undefined,
      checkHasBackupLogin: vi.fn().mockRejectedValue(new Error('cancelled')),
    })
    await pressBackupStep()

    expect(dispatch).not.toHaveBeenCalledWith(OPEN_BACKUP_MODAL)
    expect(warn).toHaveBeenCalled()
  })
})
