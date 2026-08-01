import { useDispatch } from 'react-redux'
import {
  NotificationPermission,
  useNotificationOSPermissionsEnabled,
} from 'src/features/notifications/hooks/useNotificationOSPermissionsEnabled'
import { useAddressNotificationToggle } from 'src/features/notifications/hooks/useNotificationsToggle'
import { promptPushPermission } from 'src/features/notifications/Onesignal'
import { showNotificationSettingsAlert } from 'src/features/notifications/showNotificationSettingsAlert'
import { act, renderHook, waitFor } from 'src/test/test-utils'
import type { MockedFunction } from 'vitest'
import { useSelectAccountNotificationSetting } from 'wallet/src/features/wallet/hooks'

vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')), // Keep all other exports
  useDispatch: vi.fn(),
}))

vi.mock('src/features/notifications/Onesignal', () => ({
  promptPushPermission: vi.fn(),
}))

vi.mock('src/features/notifications/hooks/useNotificationOSPermissionsEnabled', async () => ({
  ...(await vi.importActual('src/features/notifications/hooks/useNotificationOSPermissionsEnabled')),
  useNotificationOSPermissionsEnabled: vi.fn(),
}))

vi.mock('wallet/src/features/wallet/accounts/editAccountSaga', async () => ({
  ...(await vi.importActual('wallet/src/features/wallet/accounts/editAccountSaga')),
  editAccountActions: {
    trigger: vi.fn((payload) => ({ type: 'EDIT_ACCOUNT', payload })),
  },
}))

vi.mock('src/features/notifications/showNotificationSettingsAlert', () => ({
  showNotificationSettingsAlert: vi.fn(),
}))

vi.mock('src/utils/useAppStateTrigger', () => ({
  useAppStateTrigger: vi.fn(),
}))

vi.mock('wallet/src/features/wallet/hooks', () => ({
  useSelectAccountNotificationSetting: vi.fn(),
}))

describe('useAddressNotificationToggle', () => {
  const mockAddress = '0xAddress'
  const mockDispatch = vi.fn()
  const mockUseDispatch = useDispatch as MockedFunction<typeof useDispatch>
  const mockPermissionPrompt = vi.mocked(promptPushPermission)
  const mockSettingsAlert = vi.mocked(showNotificationSettingsAlert)
  const mockUseSelectAccountNotificationSetting = vi.mocked(useSelectAccountNotificationSetting)
  const mockUseNotificationOSPermissionsQuery = vi.mocked(useNotificationOSPermissionsEnabled)

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDispatch.mockReturnValue(mockDispatch)
  })

  function setupHook({
    osPermissionStatus = NotificationPermission.Enabled,
    firebaseEnabled = true,
    onPermissionChanged,
  }: {
    osPermissionStatus?: NotificationPermission
    firebaseEnabled?: boolean
    onPermissionChanged?: (enabled: boolean) => void
  } = {}) {
    mockUseNotificationOSPermissionsQuery.mockReturnValue({
      notificationPermissionsEnabled: osPermissionStatus,
      checkNotificationPermissions: vi.fn(),
    })
    mockUseSelectAccountNotificationSetting.mockReturnValue(firebaseEnabled)
    return renderHook(() => useAddressNotificationToggle({ address: mockAddress, onToggle: onPermissionChanged }))
  }

  describe('initial states', () => {
    it('returns enabled when both OS and Firebase are enabled', () => {
      const { result } = setupHook({
        osPermissionStatus: NotificationPermission.Enabled,
        firebaseEnabled: true,
      })

      expect(result.current.isEnabled).toBe(true)
      expect(result.current.isPending).toBe(false)
    })

    it('returns disabled when OS permissions are disabled', () => {
      const { result } = setupHook({
        osPermissionStatus: NotificationPermission.Disabled,
        firebaseEnabled: true,
      })

      expect(result.current.isEnabled).toBe(false)
      expect(result.current.isPending).toBe(false)
    })

    it('returns disabled when Firebase is disabled', () => {
      const { result } = setupHook({
        osPermissionStatus: NotificationPermission.Enabled,
        firebaseEnabled: false,
      })

      expect(result.current.isEnabled).toBe(false)
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('toggle flows', () => {
    // For the toggle test
    it('handles toggle when OS permissions are enabled', async () => {
      const { result } = setupHook({
        osPermissionStatus: NotificationPermission.Enabled,
        firebaseEnabled: true,
      })

      await act(async () => {
        result.current.toggle()
        await new Promise(requestAnimationFrame)
      })
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled()
        expect(result.current.isEnabled).toBe(false)
      })
    })

    it('handles OS permission prompt flow successfully', async () => {
      mockPermissionPrompt.mockResolvedValueOnce(true)

      const { result } = setupHook({
        osPermissionStatus: NotificationPermission.Disabled,
        firebaseEnabled: false,
      })

      await act(async () => {
        result.current.toggle()
        await new Promise(requestAnimationFrame)
      })

      await waitFor(() => {
        expect(mockPermissionPrompt).toHaveBeenCalled()
        expect(mockDispatch).toHaveBeenCalled()
        expect(result.current.isEnabled).toBe(true)
      })
    })

    it('handles OS permission prompt flow failure', async () => {
      mockPermissionPrompt.mockResolvedValueOnce(false)

      const { result } = setupHook({
        osPermissionStatus: NotificationPermission.Disabled,
        firebaseEnabled: false,
      })

      await act(async () => {
        result.current.toggle()
        await new Promise(requestAnimationFrame)
      })

      await waitFor(() => {
        expect(mockPermissionPrompt).toHaveBeenCalled()
        expect(mockSettingsAlert).toHaveBeenCalled()
        expect(result.current.isEnabled).toBe(false)
        expect(result.current.isPending).toBe(false)
      })
    })
  })

  describe('callbacks', () => {
    it('calls onPermissionChanged after successful toggle', async () => {
      const onPermissionChanged = vi.fn()

      const { result } = setupHook({
        osPermissionStatus: NotificationPermission.Enabled,
        firebaseEnabled: false,
        onPermissionChanged,
      })

      await act(async () => {
        result.current.toggle()
        await new Promise(requestAnimationFrame)
      })

      await waitFor(() => {
        expect(onPermissionChanged).toHaveBeenCalledWith(true)
      })
    })
  })

  describe('error handling', () => {
    it('shows settings alert and resets state on OS permission denial', async () => {
      mockPermissionPrompt.mockResolvedValueOnce(false)

      const { result } = setupHook({
        osPermissionStatus: NotificationPermission.Disabled,
      })

      await act(async () => {
        result.current.toggle()
        await new Promise(requestAnimationFrame)
      })

      await waitFor(() => {
        expect(mockSettingsAlert).toHaveBeenCalled()
        expect(result.current.isEnabled).toBe(false)
      })
    })
  })
})
