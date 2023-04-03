import { useState } from 'react'
import {
  Card,
  Circle,
  Form,
  H1,
  H2,
  Input,
  Label,
  Paragraph,
  Stack,
  XStack,
  YStack,
} from 'tamagui'
import { useAppDispatch } from '../../state'
import { importAccountActions } from '../wallet/import/importAccountSaga'
import { ImportAccountType } from '../wallet/import/types'
import { usePasswordInput } from '../auth/Locked'
import { Button } from 'ui/src/components/button/Button'

const DUMMY_SEED_PHRASE =
  'stereo gain space check elbow say usual help cinnamon inquiry snap expose'

export function IntroScreen(): JSX.Element {
  const dispatch = useAppDispatch()

  const [mnemonic, setMnemonic] = useState(DUMMY_SEED_PHRASE)
  const passwordInputProps = usePasswordInput()

  return (
    <Card alignItems="center" backgroundColor="$background0">
      <Card.Header padded alignItems="center">
        <Circle backgroundColor="$brandedAccentSoft" height={60} width={60} />
        <H2>Say hello to your new wallet</H2>

        <Paragraph>
          It has a public address for making transactions, and a nickname that’s
          only visible to you.
        </Paragraph>
      </Card.Header>

      <Stack
        alignItems="center"
        backgroundColor="$background3"
        borderRadius="$rounded16"
        justifyContent="center"
        margin="$spacing16"
        padding="$spacing36">
        <H1>Import wallet</H1>
        <Form
          onSubmit={(): void => {
            dispatch(
              importAccountActions.trigger({
                type: ImportAccountType.Mnemonic,
                validatedMnemonic: mnemonic,
                validatedPassword: passwordInputProps.value,
              })
            )
          }}>
          <YStack space="$spacing24">
            <XStack alignItems="center" space="$spacing16">
              <Label htmlFor="password">Password</Label>
              <Input
                secureTextEntry
                flex={1}
                id="password"
                {...passwordInputProps}
              />
            </XStack>

            <XStack alignItems="center" space="$spacing16">
              <Label htmlFor="mnemonic">Mnemonic</Label>
              <Input
                flex={1}
                id="mnemonic"
                value={DUMMY_SEED_PHRASE}
                onChangeText={setMnemonic}
              />
            </XStack>
            <Form.Trigger asChild>
              <Button>Import</Button>
            </Form.Trigger>
          </YStack>
        </Form>
      </Stack>

      <Card.Footer />
    </Card>
  )
}
