import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePasswordInput } from 'src/app/features/lockScreen/Locked'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingInputError } from 'src/app/features/onboarding/OnboardingInputError'
import { ONBOARDING_CONTENT_WIDTH } from 'src/app/features/onboarding/utils'
import {
  ImportOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Input, Stack, Text, XStack, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { logger } from 'wallet/src/features/logger/logger'
import { isValidPassword } from 'wallet/src/utils/password'

export function Password(): JSX.Element {
  const navigate = useNavigate()

  const [passwordError, setPasswordError] = useState<string | undefined>(undefined)
  const { setPassword } = useOnboardingContext()

  const passwordInputProps = usePasswordInput()

  const enteredPassword = passwordInputProps.value

  const onSubmit = (): void => {
    if (isValidPassword(enteredPassword)) {
      setPassword(enteredPassword)
      setPasswordError(undefined)
      navigate(
        `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Mnemonic}`
      )
    } else {
      logger.error('Password', 'onPress', 'Invalid password.')
      setPasswordError('Password is too short. Please make it at least 8 characters long.')
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
          focusStyle={styles.inputFocus}
          height="auto"
          hoverStyle={styles.inputHover}
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

const styles = {
  inputFocus: { borderWidth: 1, borderColor: '$textTertiary', outlineWidth: 0 },
  inputHover: { borderWidth: 1, borderColor: '$background3', outlineWidth: 0 },
}
