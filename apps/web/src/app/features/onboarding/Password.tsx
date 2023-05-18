import { useLocation, useNavigate } from 'react-router-dom'
import { usePasswordInput } from 'src/app/features/lockScreen/Locked'
import { Input, Stack, XStack, YStack } from 'tamagui'
import { Text } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import {
  importAccountActions,
  importAccountSagaName,
} from 'wallet/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'wallet/src/features/wallet/import/types'
import { OnboardingRoutes } from 'wallet/src/navigation/constants'
import { useAppDispatch } from 'wallet/src/state'
import { useSagaStatus } from 'wallet/src/state/useSagaStatus'

export function Password(): JSX.Element {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { state } = useLocation()
  const { mnemonic, from } = state.data as {
    mnemonic: string
    from: OnboardingRoutes
  }

  const passwordInputProps = usePasswordInput()

  useSagaStatus(importAccountSagaName, () => {
    // TODO(EXT-131): abstract into navigate util with consistent params and types
    navigate(
      `../${
        from === OnboardingRoutes.Import ? OnboardingRoutes.Complete : OnboardingRoutes.Backup
      }`,
      { state: { data: { mnemonic, from: OnboardingRoutes.Import } } }
    )
  })

  return (
    <Stack alignItems="center" gap="$spacing36" minWidth={450}>
      <YStack alignItems="center" gap="$spacing8">
        <Text variant="headlineMedium">Set a password</Text>
        <Text variant="subheadSmall">You'll need this to unlock your wallet</Text>
      </YStack>
      <Input
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
        {...passwordInputProps}
      />
      <XStack gap="$spacing12" width="100%">
        <Button flexGrow={1} theme="secondary" onPress={(): void => navigate(-1)}>
          Back
        </Button>
        <Button
          flexGrow={1}
          theme="primary"
          onPress={(): void => {
            dispatch(
              importAccountActions.trigger({
                type: ImportAccountType.Mnemonic,
                validatedMnemonic: mnemonic,
                validatedPassword: passwordInputProps.value,
                markAsActive: true,
              })
            )
          }}>
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
