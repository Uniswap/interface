import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Keyboard } from 'react-native'
import {
  PasswordErrors,
  PasswordStrength,
  getPasswordStrength,
  isPasswordStrongEnough,
} from 'wallet/src/utils/password'

export type CloudBackupPasswordFormContextType = {
  password: string
  passwordStrength: PasswordStrength
  error: PasswordErrors | undefined
  isConfirmation: boolean
  isInputValid: boolean
  onPressNext: () => void
  onPasswordSubmitEditing: () => void
  onPasswordChangeText: (newPassword: string) => void
}

export const CloudBackupPasswordFormContext = createContext<CloudBackupPasswordFormContextType | null>(null)

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
  navigateToNextScreen: ({ password }: { password: string }) => void
}>

export function CloudBackupPasswordFormContextProvider({
  children,
  isConfirmation = false,
  passwordToConfirm,
  navigateToNextScreen,
}: CloudBackupPasswordFormContextProviderProps): JSX.Element {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<PasswordErrors | undefined>(undefined)
  const [passwordStrength, setPasswordStrength] = useState(PasswordStrength.NONE)

  const isStrongPassword = isPasswordStrongEnough({
    minStrength: PasswordStrength.MEDIUM,
    currentStrength: passwordStrength,
  })

  const isInputValid = !error && password.length > 0 && (isConfirmation || isStrongPassword)

  const onPasswordChangeText = useCallback(
    (newPassword: string): void => {
      if (isConfirmation && newPassword === password) {
        setError(undefined)
      }
      // always reset error if not confirmation
      if (!isConfirmation) {
        setPasswordStrength(getPasswordStrength(newPassword))
        setError(undefined)
      }
      setPassword(newPassword)
    },
    [isConfirmation, password],
  )

  const onPasswordSubmitEditing = useCallback((): void => {
    if (!isConfirmation && !isStrongPassword) {
      return
    }
    if (isConfirmation && passwordToConfirm !== password) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }
    setError(undefined)
    Keyboard.dismiss()
  }, [isConfirmation, isStrongPassword, password, passwordToConfirm])

  const onPressNext = useCallback((): void => {
    if (isConfirmation && passwordToConfirm !== password) {
      setError(PasswordErrors.PasswordsDoNotMatch)
      return
    }

    if (!error) {
      navigateToNextScreen({ password })
    }
  }, [error, isConfirmation, navigateToNextScreen, password, passwordToConfirm])

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
