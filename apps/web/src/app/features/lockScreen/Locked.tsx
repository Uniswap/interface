import { useCallback, useState } from 'react'
import { Input } from 'src/app/components/Input'
import { useAppDispatch } from 'src/background/store'
import { useSagaStatus } from 'src/background/utils/useSagaStatus'
import { Button, Image, InputProps, Stack, Text, YStack } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { authActions, authSagaName } from 'wallet/src/features/auth/saga'
import { AuthActionType, AuthSagaError } from 'wallet/src/features/auth/types'
import { SagaStatus } from 'wallet/src/utils/saga'

const ICON_SIZE = 64

export function usePasswordInput(
  defaultValue = ''
): Pick<InputProps, 'onChangeText' | 'disabled'> & { value: string } {
  const [value, setValue] = useState(defaultValue)

  const onChangeText: InputProps['onChangeText'] = (newValue): void => {
    setValue(newValue)
  }

  return {
    value,
    disabled: !value,
    onChangeText,
  }
}

export function Locked(): JSX.Element {
  const dispatch = useAppDispatch()
  const { value: enteredPassword, onChangeText: onChangePasswordText } = usePasswordInput()

  const onChangeText = useCallback(
    (text: string) => {
      if (onChangePasswordText) {
        onChangePasswordText?.(text)
      }
    },
    [onChangePasswordText]
  )

  const { status, error } = useSagaStatus(authSagaName, undefined, false)

  const onPress = async (): Promise<void> => {
    await dispatch(
      authActions.trigger({
        type: AuthActionType.Unlock,
        password: enteredPassword,
      })
    )
  }

  const isIncorrectPassword =
    status === SagaStatus.Failure && error === AuthSagaError.InvalidPassword

  return (
    <Stack backgroundColor="$surface1" flex={1} padding="$spacing24" space="$spacing12">
      <YStack
        alignContent="flex-end"
        alignItems="center"
        flexGrow={1}
        gap="$spacing8"
        justifyContent="center">
        <Stack paddingTop="$spacing60">
          <Stack
            alignItems="center"
            backgroundColor="$surface2"
            borderRadius="$rounded24"
            justifyContent="center"
            padding="$spacing12">
            <Image height={ICON_SIZE} source={UNISWAP_LOGO} width={ICON_SIZE} />
          </Stack>
        </Stack>
        <YStack paddingBottom="$spacing32" paddingTop="$spacing24">
          <Text color="$neutral1" textAlign="center" variant="headlineMedium">
            Welcome back
          </Text>
          <Text color="$DEP_accentBranded" textAlign="center" variant="headlineMedium">
            Uniswap Wallet
          </Text>
        </YStack>
      </YStack>
      <YStack alignItems="stretch" gap="$spacing12" paddingTop="$spacing32">
        {isIncorrectPassword && (
          <Stack position="absolute" top={0} width="100%">
            <Text color="$statusCritical" textAlign="center" variant="bodySmall">
              Wrong password. Try again
            </Text>
          </Stack>
        )}
        <Input
          hideInput
          placeholder="Password"
          value={enteredPassword}
          onChangeText={onChangeText}
          onSubmitEditing={onPress}
        />
      </YStack>
      <Button size="large" theme="primary" onPress={onPress}>
        Unlock
      </Button>
    </Stack>
  )
}
