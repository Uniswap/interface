import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import {
  getPasswordStrength,
  isPasswordStrongEnough,
  PasswordErrors,
  PasswordStrength,
} from 'wallet/src/utils/password'

type CloudBackupPasswordFormContextType = {
  password: string
  passwordStrength: PasswordStrength
  error: PasswordErrors | undefined
  isConfirmation: boolean
  isInputValid: boolean
  onPressNext: () => void
  onPasswordSubmitEditing: () => void
  onPasswordChangeText: (newPassword: string) => void
}

const CloudBackupPasswordFormContext = createContext<CloudBackupPasswordFormContextType | null>(null)

export function useCloudBackupPasswordFormContext(): CloudBackupPasswordFormContextType {
  const context = useContext(CloudBackupPasswordFormContext)

  if (!context) {
    throw new Error('useCloudBackupPasswordFormContext must be used within a CloudBackupPasswordFormContextProvider')
  }

  return context
}

type CloudBackupPasswordFormContextProviderProps = PropsWithChildren<{
  isConfirmation?: boolean
  passwordToConfirm?: string
  checkPasswordBeforeSubmit?: boolean
  navigateToNextScreen: ({ password }: { password: string }) => void
}>

export function CloudBackupPasswordFormContextProvider({
  children,
  isConfirmation = false,
  passwordToConfirm,
  checkPasswordBeforeSubmit = false,
  navigateToNextScreen,
}: CloudBackupPasswordFormContextProviderProps): JSX.Element {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<PasswordErrors | undefined>(undefined)
  const [passwordStrength, setPasswordStrength] = useState(PasswordStrength.NONE)

  const isStrongPassword = isPasswordStrongEnough({
    minStrength: PasswordStrength.MEDIUM,
    currentStrength: passwordStrength,
  })

  const matchesPassword = password === passwordToConfirm
  const isInputValid =
    !error &&
    password.length > 0 &&
    (isConfirmation || isStrongPassword) &&
    (!checkPasswordBeforeSubmit || matchesPassword)

  const onPasswordChangeText = useCallback(
    (newPassword: string): void => {
      if (isConfirmation) {
        setError(undefined)
      }
      // always reset error if not confirmation
      if (!isConfirmation) {
        setPasswordStrength(getPasswordStrength(newPassword))
        setError(undefined)
      }
      setPassword(newPassword)
    },
    [isConfirmation],
  )

  const onPasswordSubmitEditing = useCallback((): void => {
    if (!isConfirmation && !isStrongPassword) {
      return
    }
    if (isConfirmation && !matchesPassword) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }
    setError(undefined)
    dismissNativeKeyboard()
  }, [isConfirmation, isStrongPassword, matchesPassword])

  const onPressNext = useCallback((): void => {
    if (isConfirmation && !matchesPassword) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }

    if (!error) {
      navigateToNextScreen({ password })
    }
  }, [error, isConfirmation, matchesPassword, navigateToNextScreen, password])

  const contextValue = useMemo<CloudBackupPasswordFormContextType>(
    () => ({
      password,
      passwordStrength,
      error,
      isConfirmation,
      isInputValid,
      onPressNext,
      onPasswordChangeText,
      onPasswordSubmitEditing,
    }),
    [
      error,
      passwordStrength,
      isConfirmation,
      isInputValid,
      onPressNext,
      onPasswordChangeText,
      onPasswordSubmitEditing,
      password,
    ],
  )

  return (
    <CloudBackupPasswordFormContext.Provider value={contextValue}>{children}</CloudBackupPasswordFormContext.Provider>
  )
}
