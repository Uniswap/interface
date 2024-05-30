import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'
import { ColorTokens } from 'ui/src'
import { useDebounce } from 'utilities/src/time/timing'
import zxcvbn from 'zxcvbn'

export enum PasswordErrors {
  WeakPassword = 'WeakPassword',
  PasswordsDoNotMatch = 'PasswordsDoNotMatch',
}

export enum PasswordStrength {
  NONE, // if there is no input or we don't want it to be displayed yet
  WEAK,
  MEDIUM,
  STRONG,
}

export const PASSWORD_VALIDATION_DEBOUNCE_MS = 750

export function isPasswordStrongEnough({
  minStrength,
  currentStrength,
}: {
  minStrength: PasswordStrength
  currentStrength: PasswordStrength
}): boolean {
  return currentStrength >= minStrength
}

export function getPasswordStrength(password: string): PasswordStrength {
  const { score } = zxcvbn(password)

  if (!password) {
    return PasswordStrength.NONE
  }

  if (score < 2) {
    return PasswordStrength.WEAK
  } else if (score < 4) {
    return PasswordStrength.MEDIUM
  } else {
    return PasswordStrength.STRONG
  }
}

export function getPasswordStrengthTextAndColor(strength: PasswordStrength): {
  text: string
  color: ColorTokens
} {
  switch (strength) {
    case PasswordStrength.WEAK:
      return { text: t('common.input.password.strength.weak'), color: '$statusCritical' }
    case PasswordStrength.MEDIUM:
      return {
        text: t('common.input.password.strength.medium'),
        color: '$DEP_accentWarning',
      }
    case PasswordStrength.STRONG:
      return { text: t('common.input.password.strength.strong'), color: '$statusSuccess' }
    default:
      return { text: '', color: '$neutral1' }
  }
}

function doPasswordsDiffer(password: string, confirmPassword: string): boolean {
  return Boolean(password && confirmPassword) && password !== confirmPassword
}

export function usePasswordForm(): {
  password: string
  confirmPassword: string
  hideInput: boolean
  enableNext: boolean
  debouncedPasswordStrength: PasswordStrength
  errorText: string
  onChangePassword: (text: string) => void
  onChangeConfirmPassword: (text: string) => void
  setHideInput: (value: boolean) => void
  checkSubmit: () => boolean
  onPasswordBlur: () => void
} {
  const [lostPasswordFocus, setLostPasswordFocused] = useState(false)
  const onPasswordBlur = (): void => setLostPasswordFocused(true)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hideInput, setHideInput] = useState(true)
  const [error, setError] = useState<PasswordErrors | undefined>(undefined)

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const debouncedPasswordStrength = useDebounce(passwordStrength, PASSWORD_VALIDATION_DEBOUNCE_MS)

  const isWeakPassword = useMemo(
    () =>
      password &&
      !isPasswordStrongEnough({
        currentStrength: passwordStrength,
        minStrength: PasswordStrength.MEDIUM,
      }),
    [passwordStrength, password]
  )

  const debouncedPassword = useDebounce(password, PASSWORD_VALIDATION_DEBOUNCE_MS * 2)
  const debouncedConfirmPassword = useDebounce(confirmPassword, PASSWORD_VALIDATION_DEBOUNCE_MS * 2)

  const debouncedPasswordsDiffer = useMemo(
    () => doPasswordsDiffer(debouncedPassword, debouncedConfirmPassword),
    [debouncedPassword, debouncedConfirmPassword]
  )

  const enableNext = Boolean(password && confirmPassword) && !isWeakPassword

  const onChangePassword = (text: string): void => {
    setPassword(text)
  }

  const onChangeConfirmPassword = (text: string): void => {
    // if the user corrects the mismatched passwords then clear the error rigtht away without waiting for the debounce.
    if ((!text || text === password) && error === PasswordErrors.PasswordsDoNotMatch) {
      setError(undefined)
    }
    setConfirmPassword(text)
  }

  useEffect(() => {
    if (isWeakPassword && lostPasswordFocus) {
      setError(PasswordErrors.WeakPassword)
    } else if (debouncedPasswordsDiffer) {
      setError(PasswordErrors.PasswordsDoNotMatch)
    } else {
      setError(undefined)
    }
  }, [debouncedPasswordsDiffer, isWeakPassword, lostPasswordFocus])

  const errorText: string = useMemo(() => {
    if (error === PasswordErrors.WeakPassword) {
      return t('common.input.password.error.weak')
    }
    if (error === PasswordErrors.PasswordsDoNotMatch) {
      return t('common.input.password.error.mismatch')
    }
    return ''
  }, [error])

  const checkSubmit = (): boolean => {
    const isValid = !isWeakPassword && !doPasswordsDiffer(password, confirmPassword)

    if (!isValid) {
      setError(isWeakPassword ? PasswordErrors.WeakPassword : PasswordErrors.PasswordsDoNotMatch)
    }

    return isValid
  }

  return {
    password,
    confirmPassword,
    hideInput,
    enableNext,
    debouncedPasswordStrength,
    errorText,
    onChangePassword,
    onChangeConfirmPassword,
    setHideInput,
    checkSubmit,
    onPasswordBlur,
  }
}
