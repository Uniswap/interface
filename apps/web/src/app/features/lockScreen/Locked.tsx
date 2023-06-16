import { useState } from 'react'
import { useAppDispatch } from 'src/background/store'
import { useSagaStatus } from 'src/background/utils/useSagaStatus'
import { Image, Input, InputProps, Stack, Text, YStack } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { Button, ButtonSize } from 'ui/src/components/button/Button'
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

function Locked(): JSX.Element {
  const dispatch = useAppDispatch()
  const passwordInputProps = usePasswordInput()

  const { status, error } = useSagaStatus(authSagaName, undefined, false)

  const onPress = (): void => {
    dispatch(
      authActions.trigger({
        type: AuthActionType.Unlock,
        password: passwordInputProps.value,
      })
    )
  }

  const isIncorrectPassword =
    status === SagaStatus.Failure && error === AuthSagaError.InvalidPassword

  return (
    <Stack flexGrow={1} padding="$spacing24" space="$spacing12">
      <YStack
        alignContent="flex-end"
        alignItems="center"
        flexGrow={1}
        gap="$spacing8"
        justifyContent="center">
        <Stack paddingBottom="$spacing8">
          <Stack
            alignItems="center"
            backgroundColor="$white"
            borderRadius="$rounded24"
            justifyContent="center"
            padding="$spacing12">
            <Image height={ICON_SIZE} source={UNISWAP_LOGO} width={ICON_SIZE} />
          </Stack>
        </Stack>
        <Text color="$textPrimary" textAlign="center" variant="headlineMedium">
          Welcome back
        </Text>
        <Text color="$accentBranded" textAlign="center" variant="subheadLarge">
          Uniswap Wallet
        </Text>
      </YStack>
      <YStack alignItems="stretch" gap="$spacing12">
        {isIncorrectPassword && (
          <Text color="$accentCritical" textAlign="center" variant="bodySmall">
            Wrong password. Try again
          </Text>
        )}
        <Input
          autoFocus
          secureTextEntry
          borderColor={isIncorrectPassword ? '$accentCritical' : '$backgroundOutline'}
          borderRadius={100}
          borderWidth={0.5}
          fontSize={16}
          fontWeight="400"
          height={56}
          paddingHorizontal="$spacing24"
          paddingVertical="$spacing16"
          placeholder="Enter password to unlock"
          placeholderTextColor="$textTertiary"
          onSubmitEditing={onPress}
          {...passwordInputProps}
          backgroundColor={isIncorrectPassword ? '$accentCriticalSoft' : '$backgroundScrim'}
          color="$textPrimary"
        />
      </YStack>
      <Button buttonSize={ButtonSize.Large} theme="primary" onPress={onPress}>
        Unlock
      </Button>
    </Stack>
  )
}

export default Locked
