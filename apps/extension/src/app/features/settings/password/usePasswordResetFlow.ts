import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useBiometricUnlockDisableMutation } from 'src/app/features/biometricUnlock/useBiometricUnlockDisableMutation'
import { useChangePasswordWithBiometricMutation } from 'src/app/features/biometricUnlock/useChangePasswordWithBiometricMutation'
import { useHasBiometricUnlockCredential } from 'src/app/features/biometricUnlock/useShouldShowBiometricUnlock'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Password Reset Flow State Machine
 *
 * This hook manages the password reset flow using a state machine pattern to ensure
 * only one modal is open at a time and transitions are predictable.
 *
 * State Transition Diagram:
 * ========================
 *
 * Initial State: None
 *
 * From None:
 * └─ Start Password Reset → EnterCurrentPassword
 *
 * From EnterCurrentPassword:
 * ├─ onClose → None
 * ├─ onNext (no password) → None
 * └─ onNext (with password) → EnterNewPassword
 *
 * From EnterNewPassword:
 * ├─ onClose → None
 * └─ onNext → BiometricAuth (if biometric enabled) OR None (+ success notification) (if no biometric)
 *
 * From BiometricAuth:
 * ├─ onClose → None (disable biometric unlock)
 * └─ onAuthenticate → None (+ re-encrypt + success notification)
 *
 * State Dependencies:
 * ==================
 * - hasBiometricUnlockCredential: Determines EnterNewPassword → BiometricAuth vs immediate success
 *
 * Close Handler Strategy:
 * ======================
 * Each modal uses closeModal(expectedState) which only closes if current state matches expected state.
 * This prevents race conditions where late-firing close handlers interfere with state transitions.
 */

export enum PasswordResetFlowState {
  None = 'none',
  EnterCurrentPassword = 'enterCurrentPassword',
  EnterNewPassword = 'enterNewPassword',
  BiometricAuth = 'biometricAuth',
}

interface PasswordResetFlowResult {
  // State
  flowState: PasswordResetFlowState
  oldPassword: string | undefined

  // Actions
  startPasswordReset: () => void
  closeModal: (expectedState: PasswordResetFlowState) => void

  // Modal handlers
  onPasswordModalNext: (password?: string) => void
  onChangePasswordModalNext: (password: string) => void
  onBiometricAuthModalClose: () => void
}

export function usePasswordResetFlow(): PasswordResetFlowResult {
  const dispatch = useDispatch()
  const [flowState, setFlowState] = useState<PasswordResetFlowState>(PasswordResetFlowState.None)
  const [oldPassword, setOldPassword] = useState<string | undefined>(undefined)

  const hasBiometricUnlockCredential = useHasBiometricUnlockCredential()

  const { mutate: disableBiometricUnlock } = useBiometricUnlockDisableMutation()

  // Handle biometric authentication for password change
  const { mutate: reEncryptPasswordWithBiometric } = useChangePasswordWithBiometricMutation({
    onSuccess: () => {
      setFlowState(PasswordResetFlowState.None)
      dispatch(pushNotification({ type: AppNotificationType.PasswordChanged }))
    },
    onError: () => {
      // Disable biometric unlock because the encrypted password was not updated
      disableBiometricUnlock()
      setFlowState(PasswordResetFlowState.None)
    },
  })

  const startPasswordReset = useEvent(() => {
    setFlowState(PasswordResetFlowState.EnterCurrentPassword)
  })

  const closeModal = useEvent((expectedState: PasswordResetFlowState) => {
    // When transitioning between modal states, the previous modal's `isOpen` becomes `false` and triggers `onClose`.
    // This check ensures the close action is from user interaction, not from modal state changes.
    if (flowState === expectedState) {
      setFlowState(PasswordResetFlowState.None)
      setOldPassword(undefined)
    }
  })

  const onPasswordModalNext = useEvent((password?: string): void => {
    if (!password) {
      setFlowState(PasswordResetFlowState.None)
      setOldPassword(undefined)
      return
    }

    setOldPassword(password)
    setFlowState(PasswordResetFlowState.EnterNewPassword)
  })

  const onChangePasswordModalNext = useEvent((password: string): void => {
    if (hasBiometricUnlockCredential) {
      // If biometric unlock is enabled, show biometric auth modal
      setFlowState(PasswordResetFlowState.BiometricAuth)
      reEncryptPasswordWithBiometric(password)
    } else {
      // If biometric unlock is not enabled, complete the flow
      setFlowState(PasswordResetFlowState.None)
      dispatch(pushNotification({ type: AppNotificationType.PasswordChanged }))
    }
  })

  const onBiometricAuthModalClose = useEvent((): void => {
    disableBiometricUnlock()
    closeModal(PasswordResetFlowState.BiometricAuth)
  })

  return {
    // State
    flowState,
    oldPassword,

    // Actions
    startPasswordReset,
    closeModal,

    // Modal handlers
    onPasswordModalNext,
    onChangePasswordModalNext,
    onBiometricAuthModalClose,
  }
}
