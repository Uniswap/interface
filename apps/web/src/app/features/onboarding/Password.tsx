import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePasswordInput } from 'src/app/features/lockScreen/Locked'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingInput } from 'src/app/features/onboarding/OnboardingInput'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
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

  const passwordInputProps = usePasswordInput()

  const enteredPassword = passwordInputProps.value

  const onSubmit = (): void => {
    const passwordValidationResult = validatePassword(enteredPassword)
    if (passwordValidationResult.valid) {
      setPassword(enteredPassword)
      setPasswordError(undefined)
      navigate(nextPath)

      // in import flow, we create the account later in the flow
      // in create flow, we need to create it here
      if (createAccountOnNext) {
        dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
        dispatch(createAccountActions.trigger({ validatedPassword: enteredPassword }))
      }
    } else {
      setPasswordError(passwordValidationResult.validationErrorString)
    }
  }

  return (
    <OnboardingScreen
      Icon={
        <Circle backgroundColor="$magentaDark" height={iconSizes.icon64} width={iconSizes.icon64}>
          <Icons.Lock color="$magentaVibrant" size={iconSizes.icon36} />
        </Circle>
      }
      inputError={passwordError}
      nextButtonEnabled={!!passwordInputProps.value && !passwordError}
      nextButtonText="Continue"
      subtitle="You'll need this to unlock your wallet"
      title="First, set a password"
      onSubmit={onSubmit}>
      <OnboardingInput
        hideInput
        placeholderText="New password"
        onChangeText={(): void => {
          setPasswordError(undefined)
        }}
        onSubmit={onSubmit}
        {...passwordInputProps}
      />
    </OnboardingScreen>
  )
}
