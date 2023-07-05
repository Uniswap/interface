import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingInputError } from 'src/app/features/onboarding/OnboardingInputError'
import { ONBOARDING_CONTENT_WIDTH } from 'src/app/features/onboarding/utils'
import {
  ImportOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { useAppDispatch } from 'src/background/store'
import { Input, Stack, Text, XStack, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { inputStyles } from 'ui/src/components/input/utils'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { importAccountActions } from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'
import { validateMnemonic } from 'wallet/src/utils/mnemonics'

export function ImportMnemonic(): JSX.Element {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [mnemonic, setMnemonic] = useState('')
  const { password } = useOnboardingContext()
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  useEffect(() => {
    // Delete any pending accounts before entering flow.
    dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
  }, [dispatch])

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(() => {
    const { validMnemonic, error } = validateMnemonic(mnemonic)

    if (error) {
      // TODO: better error handling
      setErrorMessage(`Invalid recovery phrase: ${error}`)
      return
    }

    dispatch(
      importAccountActions.trigger({
        type: ImportAccountType.Mnemonic,
        validatedMnemonic: validMnemonic,
        validatedPassword: password,
        indexes: Array.from(Array(NUMBER_OF_WALLETS_TO_IMPORT).keys()),
      })
    )

    navigate(
      `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Select}`
    )
  }, [mnemonic, navigate, dispatch, password])

  return (
    <Stack alignItems="center" gap="$spacing36" width={ONBOARDING_CONTENT_WIDTH}>
      <YStack alignItems="center" gap="$spacing8">
        <Text variant="headlineMedium">Enter your recovery phrase</Text>
        <Text variant="subheadSmall">
          Your recovery phrase will only be stored locally on your browser
        </Text>
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
          id="mnemonic"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12"
          placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
          placeholderTextColor="$textTertiary"
          value={mnemonic}
          width="100%"
          onChange={(): void => {
            setErrorMessage(undefined)
          }}
          onChangeText={setMnemonic}
          onSubmitEditing={onSubmit}
        />
        {errorMessage && <OnboardingInputError error={errorMessage} />}
      </YStack>
      <XStack gap="$spacing12" width="100%">
        <Button flexGrow={1} theme="secondary" onPress={(): void => navigate(-1)}>
          Back
        </Button>
        <Button
          disabled={!mnemonic || !!errorMessage}
          flexGrow={1}
          theme="primary"
          onPress={onSubmit}>
          Next
        </Button>
      </XStack>
    </Stack>
  )
}
