import { useState } from 'react'

import { Input, InputProps, Stack, Text, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { useAppDispatch } from '../../state'
import { SagaStatus } from '../../utils/saga'
import { authActions, authSagaName } from './saga'
import { AuthType } from './types'

import { useSagaStatus } from 'app/src/state/useSagaStatus'

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

  const { status } = useSagaStatus(authSagaName, undefined, false)

  const onPress = (): void => {
    dispatch(
      authActions.trigger({
        type: AuthType.Password,
        password: passwordInputProps.value,
      })
    )
  }

  const isIncorrectPassword = status === SagaStatus.Failure

  return (
    <Stack padding="$spacing24" space="$spacing12">
      <Text color="$textPrimary" variant="headlineSmall">
        Enter your password
      </Text>
      <YStack>
        <Input
          secureTextEntry
          {...passwordInputProps}
          backgroundColor="$background3"
          color="$textPrimary"
        />
        {isIncorrectPassword && (
          <Text color="red" variant="bodySmall">
            Wrong password. Try again!
          </Text>
        )}
      </YStack>
      <Button onPress={onPress}>Unlock</Button>
    </Stack>
  )
}

export default Locked
