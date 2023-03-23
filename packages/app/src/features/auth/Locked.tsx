import { Button } from 'ui/src/components/button/Button'
import { Stack, Text } from 'ui/src'
import { useState } from 'react'
import { useAppDispatch } from '../../state'
import { authActions } from './saga'

function Locked(): JSX.Element {
  const dispatch = useAppDispatch()
  const [password, setPassword] = useState('')

  const onPress = (): void => {
    dispatch(authActions.trigger({ password }))
  }

  //TODO: use Tamagui for input
  return (
    <Stack>
      <Text>hello</Text>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button onPress={onPress}>
        <Text>Unlock</Text>
      </Button>
    </Stack>
  )
}

export default Locked
