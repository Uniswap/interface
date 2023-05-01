import { useLocation, useNavigate } from 'react-router-dom'
import { Input, Stack, XStack } from 'tamagui'
import { Text } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { usePasswordInput } from 'wallet/src/features/auth/Locked'
import { OnboardingRoutes } from 'wallet/src/navigation/constants'
import { useAppDispatch } from 'wallet/src/state'
import { useSagaStatus } from 'wallet/src/state/useSagaStatus'
import {
  importAccountActions,
  importAccountSagaName,
} from '../wallet/import/importAccountSaga'
import { ImportAccountType } from '../wallet/import/types'

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
        from === OnboardingRoutes.Import
          ? OnboardingRoutes.Complete
          : OnboardingRoutes.Backup
      }`,
      { state: { data: { mnemonic, from: OnboardingRoutes.Import } } }
    )
  })

  return (
    <Stack alignItems="center">
      <Text variant="headlineMedium">Set a password</Text>
      <Text variant="subheadSmall">You'll need this to unlock your wallet</Text>
      <Input
        secureTextEntry
        id="password"
        maxWidth={180}
        {...passwordInputProps}
      />
      <XStack>
        <Button onPress={(): void => navigate(-1)}>Back</Button>
        <Button
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
