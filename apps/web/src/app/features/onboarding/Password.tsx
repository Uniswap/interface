import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePasswordInput } from 'src/app/features/lockScreen/Locked'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingInputError } from 'src/app/features/onboarding/OnboardingInputError'
import { ONBOARDING_CONTENT_WIDTH } from 'src/app/features/onboarding/utils'
import { useAppDispatch } from 'src/background/store'
import { Input, Stack, XStack, YStack } from 'tamagui'
import { Text } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { inputStyles } from 'ui/src/components/input/utils'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { isValidPassword } from 'wallet/src/utils/password'

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
    const passwordValidationResult = isValidPassword(enteredPassword)
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
    <Stack alignItems="center" gap="$spacing36" width={ONBOARDING_CONTENT_WIDTH}>
      <YStack alignItems="center" gap="$spacing8">
        <Text variant="headlineMedium">First, create a password</Text>
        <Text variant="subheadSmall">You'll need this to unlock your wallet</Text>
      </YStack>
      <YStack alignItems="center" gap="$spacing8" width="100%">
        <Input
          autoFocus
          secureTextEntry
          backgroundColor="$background1"
          borderColor="$backgroundOutline"
          borderRadius="$rounded12"
          borderWidth={1}
          focusStyle={inputStyles.inputFocus}
          height="auto"
          hoverStyle={inputStyles.inputHover}
          id="password"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12"
          placeholder="Enter your password"
          placeholderTextColor="$textTertiary"
          width="100%"
          onChange={(): void => {
            setPasswordError(undefined)
          }}
          onSubmitEditing={onSubmit}
          {...passwordInputProps}
        />
        {passwordError && <OnboardingInputError error={passwordError} />}
      </YStack>
      <XStack gap="$spacing12" width="100%">
        <Button flexGrow={1} theme="secondary" onPress={(): void => navigate(-1)}>
          Back
        </Button>
        <Button
          disabled={!passwordInputProps.value || !!passwordError}
          flexGrow={1}
          theme="primary"
          onPress={onSubmit}>
          Next
        </Button>
      </XStack>
    </Stack>
  )
}
