import { useCallback, useState } from 'react'
import { Input } from 'src/app/components/Input'
import { useAppDispatch } from 'src/background/store'
import { useSagaStatus } from 'src/background/utils/useSagaStatus'
import { Button, Flex, Image, InputProps, Text } from 'ui/src'
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
    <Flex fill bg="$surface1" gap="$spacing12" p="$spacing24">
      <Flex centered grow alignContent="flex-end" gap="$spacing8">
        <Flex pt="$spacing60">
          <Flex
            alignItems="center"
            backgroundColor="$surface2"
            borderRadius="$rounded24"
            justifyContent="center"
            p="$spacing12">
            <Image height={ICON_SIZE} source={UNISWAP_LOGO} width={ICON_SIZE} />
          </Flex>
        </Flex>
        <Flex pb="$spacing32" pt="$spacing24">
          <Text color="$neutral1" textAlign="center" variant="headlineMedium">
            Welcome back
          </Text>
          <Text color="$DEP_accentBranded" textAlign="center" variant="headlineMedium">
            Uniswap Wallet
          </Text>
        </Flex>
      </Flex>
      <Flex alignItems="stretch" gap="$spacing12" pt="$spacing32">
        {isIncorrectPassword && (
          <Flex position="absolute" top={0} width="100%">
            <Text color="$statusCritical" textAlign="center" variant="bodySmall">
              Wrong password. Try again
            </Text>
          </Flex>
        )}
        <Input
          hideInput
          placeholder="Password"
          value={enteredPassword}
          onChangeText={onChangeText}
          onSubmitEditing={onPress}
        />
      </Flex>
      <Button size="large" theme="primary" onPress={onPress}>
        Unlock
      </Button>
    </Flex>
  )
}
