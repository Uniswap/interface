import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from 'src/app/components/Input'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { TopLevelRoutes } from 'src/app/navigation/constants'
import { useAppDispatch } from 'src/background/store'
import { Button, Circle, Flex, FlexProps, Icons } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useDebounce } from 'utilities/src/time/timing'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import type { PasswordValidationResult } from 'wallet/src/utils/password'
import { validatePassword } from 'wallet/src/utils/password'

const iconProps = {
  color: '$neutral3',
  height: '20px',
  width: '20px',
}

export function Password({
  nextPath,
  createAccountOnNext,
}: {
  nextPath: string
  createAccountOnNext?: boolean
}): JSX.Element {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [hide, setHide] = useState(true)

  const [passwordError, setPasswordError] = useState<PasswordValidationResult | null>(null)
  const { password, setPassword } = useOnboardingContext()
  const debouncedPassword = useDebounce(password)
  const [confirmPassword, setConfirmPassword] = useState('')
  const debouncedConfirmPassword = useDebounce(confirmPassword)

  // validate password
  useEffect(() => {
    if (!debouncedPassword) {
      setPasswordError(null)
      return
    }

    const passwordValidationResult = validatePassword(debouncedPassword)

    if (!passwordValidationResult.valid) {
      setPasswordError(passwordValidationResult)
      return
    }

    if (
      debouncedPassword &&
      debouncedConfirmPassword &&
      debouncedPassword !== debouncedConfirmPassword
    ) {
      setPasswordError({ valid: true, validationErrorString: 'Password inputs do not match.' })
    }
  }, [debouncedPassword, debouncedConfirmPassword])

  const onChangeText = useCallback(
    (text: string) => {
      setPasswordError(null)
      if (setPassword) setPassword(text)
    },
    [setPassword]
  )
  const onChangeConfirmText = useCallback(
    (text: string) => {
      setPasswordError(null)
      if (setConfirmPassword) setConfirmPassword(text)
    },
    [setConfirmPassword]
  )

  const onSubmit = useCallback(async () => {
    if (!debouncedPassword) return
    const passwordValidationResult = validatePassword(debouncedPassword)

    if (!passwordValidationResult.valid) {
      setPasswordError(passwordValidationResult)
      return
    }

    // Password is valid, use and continue
    setPassword(debouncedPassword)
    setPasswordError(null)

    // in import flow, we create the account later in the flow
    // in create flow, we need to create it here
    if (createAccountOnNext) {
      await dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
      await dispatch(
        createAccountActions.trigger({
          validatedPassword: debouncedPassword,
          skipSetAsActive: true,
        })
      )
    }

    navigate(nextPath, { replace: true })
  }, [createAccountOnNext, debouncedPassword, dispatch, navigate, nextPath, setPassword])

  const passwordsMatch =
    debouncedPassword === password && debouncedConfirmPassword === confirmPassword
  const passwordsFilled = Boolean(debouncedPassword && debouncedConfirmPassword)
  const enableNextButton =
    passwordsMatch &&
    passwordsFilled &&
    debouncedPassword === debouncedConfirmPassword &&
    !passwordError

  const inputError =
    passwordError?.validationErrorString ||
    (passwordError && 'Please choose a stronger password') ||
    undefined

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
      inputError={inputError}
      nextButtonEnabled={enableNextButton}
      nextButtonText="Continue"
      subtitle="You'll need this to unlock your wallet"
      title="First, set a password"
      onBack={(): void => navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })}
      onSubmit={onSubmit}>
      <>
        <Flex row position="relative" width="100%">
          <Input
            autoFocus
            large
            hideInput={hide}
            placeholder="New password"
            pr="$spacing48"
            value={password}
            onChangeText={onChangeText}
          />
          <Button
            backgroundColor="$transparent"
            hoverStyle={{ backgroundColor: 'transparent' } as FlexProps}
            position="absolute"
            pressStyle={{ backgroundColor: 'transparent' } as FlexProps}
            right="$spacing8"
            top="calc(50% - 20px)"
            onPress={(): void => setHide(!hide)}>
            {hide ? <Icons.Eye {...iconProps} /> : <Icons.EyeOff {...iconProps} />}
          </Button>
        </Flex>
        <Flex row position="relative" width="100%">
          <Input
            large
            hideInput={hide}
            placeholder="Confirm password"
            pr="$spacing48"
            value={confirmPassword}
            onChangeText={onChangeConfirmText}
            onSubmitEditing={onSubmit}
          />
        </Flex>
      </>
    </OnboardingScreen>
  )
}
