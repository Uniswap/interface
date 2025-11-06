import { act, renderHook } from '@testing-library/react'
import { useDispatch } from 'react-redux'
import { useBiometricUnlockDisableMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockDisableMutation'
import { useChangePasswordWithBiometricMutation } from 'src/app/features/biometricUnlock/useChangePasswordWithBiometricMutation'
import { useHasBiometricUnlockCredential } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlock'
import { PasswordResetFlowState, usePasswordResetFlow } from 'src/app/features/settings/password/usePasswordResetFlow'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'

// Mock dependencies
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}))

jest.mock('src/app/features/biometricUnlock/useShouldShowBiometricUnlock', () => ({
  useHasBiometricUnlockCredential: jest.fn(),
}))

jest.mock('src/app/features/biometricUnlock/useChangePasswordWithBiometricMutation', () => ({
  useChangePasswordWithBiometricMutation: jest.fn(),
}))

jest.mock('src/app/features/biometricUnlock/useBiometricUnlockDisableMutation', () => ({
  useBiometricUnlockDisableMutation: jest.fn(),
}))

jest.mock('uniswap/src/features/notifications/slice/slice', () => ({
  pushNotification: jest.fn(),
}))

jest.mock('utilities/src/react/hooks', () => ({
  useEvent: jest.fn((fn) => fn),
}))

const mockDispatch = jest.fn()
const mockMutate = jest.fn()
const mockDisableBiometricMutate = jest.fn()
const mockUseHasBiometricUnlockCredential = useHasBiometricUnlockCredential as jest.MockedFunction<
  typeof useHasBiometricUnlockCredential
>
const mockUseChangePasswordWithBiometricMutation = useChangePasswordWithBiometricMutation as jest.MockedFunction<
  typeof useChangePasswordWithBiometricMutation
>
const mockUseBiometricUnlockDisableMutation = useBiometricUnlockDisableMutation as jest.MockedFunction<
  typeof useBiometricUnlockDisableMutation
>
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>

describe('usePasswordResetFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDispatch.mockReturnValue(mockDispatch)
    mockUseHasBiometricUnlockCredential.mockReturnValue(false)
    mockUseChangePasswordWithBiometricMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any)
    mockUseBiometricUnlockDisableMutation.mockReturnValue({
      mutate: mockDisableBiometricMutate,
      isPending: false,
    } as any)
  })

  it('should initialize with None state', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    expect(result.current.flowState).toBe(PasswordResetFlowState.None)
  })

  it('should initialize with undefined oldPassword', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    expect(result.current.oldPassword).toBeUndefined()
  })

  it('should transition to EnterCurrentPassword when starting password reset', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.EnterCurrentPassword)
  })

  it('should transition to EnterNewPassword when valid password is provided', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext('validPassword')
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.EnterNewPassword)
  })

  it('should store oldPassword when valid password is provided', () => {
    const { result } = renderHook(() => usePasswordResetFlow())
    const testPassword = 'myOldPassword123!'

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext(testPassword)
    })

    expect(result.current.oldPassword).toBe(testPassword)
    expect(result.current.flowState).toBe(PasswordResetFlowState.EnterNewPassword)
  })

  it('should return to None state when no password is provided', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext()
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.None)
  })

  it('should clear oldPassword when no password is provided', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext('validPassword')
    })

    expect(result.current.oldPassword).toBe('validPassword')

    // Go back and provide no password
    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext()
    })

    expect(result.current.oldPassword).toBeUndefined()
    expect(result.current.flowState).toBe(PasswordResetFlowState.None)
  })

  it('should transition to BiometricAuth when biometric is enabled', () => {
    mockUseHasBiometricUnlockCredential.mockReturnValue(true)
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext('validPassword')
    })

    act(() => {
      result.current.onChangePasswordModalNext('newPassword')
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.BiometricAuth)
  })

  it('should complete flow immediately when biometric is disabled', () => {
    mockUseHasBiometricUnlockCredential.mockReturnValue(false)
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext('validPassword')
    })

    act(() => {
      result.current.onChangePasswordModalNext('newPassword')
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.None)
    expect(mockDispatch).toHaveBeenCalledWith(pushNotification({ type: AppNotificationType.PasswordChanged }))
  })

  it('should close modal when closeModal is called with matching state', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.EnterCurrentPassword)

    act(() => {
      result.current.closeModal(PasswordResetFlowState.EnterCurrentPassword)
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.None)
  })

  it('should clear oldPassword when closeModal is called with matching state', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext('testPassword123')
    })

    expect(result.current.oldPassword).toBe('testPassword123')
    expect(result.current.flowState).toBe(PasswordResetFlowState.EnterNewPassword)

    act(() => {
      result.current.closeModal(PasswordResetFlowState.EnterNewPassword)
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.None)
    expect(result.current.oldPassword).toBeUndefined()
  })

  it('should not close modal when closeModal is called with non-matching state', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.EnterCurrentPassword)

    act(() => {
      result.current.closeModal(PasswordResetFlowState.BiometricAuth)
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.EnterCurrentPassword)
  })

  it('should not clear oldPassword when closeModal is called with non-matching state', () => {
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext('testPassword456')
    })

    expect(result.current.oldPassword).toBe('testPassword456')
    expect(result.current.flowState).toBe(PasswordResetFlowState.EnterNewPassword)

    act(() => {
      result.current.closeModal(PasswordResetFlowState.BiometricAuth)
    })

    // Should not clear oldPassword or change state
    expect(result.current.flowState).toBe(PasswordResetFlowState.EnterNewPassword)
    expect(result.current.oldPassword).toBe('testPassword456')
  })

  it('should transition to BiometricAuth state when biometric is enabled and trigger internal mutation', () => {
    mockUseHasBiometricUnlockCredential.mockReturnValue(true)
    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext('validPassword')
    })

    act(() => {
      result.current.onChangePasswordModalNext('newPassword')
    })

    // Should transition to BiometricAuth state, which internally triggers the biometric mutation
    expect(result.current.flowState).toBe(PasswordResetFlowState.BiometricAuth)
  })

  it('should handle biometric mutation error and reset flow state', () => {
    let onErrorCallback: ((error: Error) => void) | undefined

    mockUseHasBiometricUnlockCredential.mockReturnValue(true)
    mockUseChangePasswordWithBiometricMutation.mockImplementation((options) => {
      onErrorCallback = options?.onError
      return {
        mutate: mockMutate,
        isPending: false,
      } as any
    })

    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext('validPassword')
    })

    act(() => {
      result.current.onChangePasswordModalNext('newPassword')
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.BiometricAuth)

    // Simulate biometric authentication error
    act(() => {
      onErrorCallback?.(new Error('Biometric authentication failed'))
    })

    // Should reset to None state after error
    expect(result.current.flowState).toBe(PasswordResetFlowState.None)
  })

  it('should handle biometric mutation success and complete flow', () => {
    let onSuccessCallback: (() => void) | undefined

    mockUseHasBiometricUnlockCredential.mockReturnValue(true)
    mockUseChangePasswordWithBiometricMutation.mockImplementation((options) => {
      onSuccessCallback = options?.onSuccess
      return {
        mutate: mockMutate,
        isPending: false,
      } as any
    })

    const { result } = renderHook(() => usePasswordResetFlow())

    act(() => {
      result.current.startPasswordReset()
    })

    act(() => {
      result.current.onPasswordModalNext('validPassword')
    })

    act(() => {
      result.current.onChangePasswordModalNext('newPassword')
    })

    expect(result.current.flowState).toBe(PasswordResetFlowState.BiometricAuth)

    // Simulate biometric authentication success
    act(() => {
      onSuccessCallback?.()
    })

    // Should complete flow and show success notification
    expect(result.current.flowState).toBe(PasswordResetFlowState.None)
    expect(mockDispatch).toHaveBeenCalledWith(pushNotification({ type: AppNotificationType.PasswordChanged }))
  })
})
