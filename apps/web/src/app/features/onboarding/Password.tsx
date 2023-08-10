import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePasswordInput } from 'src/app/features/lockScreen/Locked'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingInput } from 'src/app/features/onboarding/OnboardingInput'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { useAppDispatch } from 'src/background/store'
import { Circle, Icons } from 'ui/src'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { validatePassword } from 'wallet/src/utils/password'

export function Password({
  nextPath,
  createAccountOnNext,
}: {
  nextPath: string
  createAccountOnNext?: boolean
}): JSX.Element {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [passwordError, setPasswordError] = useState<string | undefined>(undefined)
  const { setPassword } = useOnboardingContext()

  const { value: enteredPassword, onChangeText: onChangePasswordText } = usePasswordInput()

  const onChangeText = useCallback(
    (text: string) => {
      setPasswordError(undefined)
      if (onChangePasswordText) {
        onChangePasswordText(text)
      }
    },
    [onChangePasswordText]
  )

  const onSubmit = async (): Promise<void> => {
    const passwordValidationResult = validatePassword(enteredPassword)

    if (!passwordValidationResult.valid) {
      setPasswordError(passwordValidationResult.validationErrorString)
      return
    }

    // Password is valid, use and continue
    setPassword(enteredPassword)
    setPasswordError(undefined)

    // in import flow, we create the account later in the flow
    // in create flow, we need to create it here
    if (createAccountOnNext) {
      await dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
      await dispatch(
        createAccountActions.trigger({
          validatedPassword: enteredPassword,
          skipSetAsActive: true,
        })
      )
    }

    navigate(nextPath, { replace: true })
  }

  return (
    <OnboardingScreen
      Icon={
        <Circle
          backgroundColor="$DEP_magentaDark"
          height={iconSizes.icon64}
          width={iconSizes.icon64}>
          <Icons.Lock color="$accent1" size={iconSizes.icon36} />
        </Circle>
      }
      inputError={passwordError}
      nextButtonEnabled={!!enteredPassword && !passwordError}
      nextButtonText="Continue"
      subtitle="You'll need this to unlock your wallet"
      title="First, set a password"
      onBack={(): void => navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })}
      onSubmit={onSubmit}>
      <OnboardingInput
        hideInput
        placeholderText="New password"
        value={enteredPassword}
        onChangeText={onChangeText}
        onSubmit={onSubmit}
      />
    </OnboardingScreen>
  )
}
