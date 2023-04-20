import { useState } from 'react'
import { Card, Form, H2, Input, Label, Stack, XStack, YStack } from 'tamagui'
import { Button } from 'ui/src/components/button/Button'
import { useAppDispatch } from '../../state'
import { usePasswordInput } from '../auth/Locked'
import { importAccountActions } from '../wallet/import/importAccountSaga'
import { ImportAccountType } from '../wallet/import/types'

export function ImportMnemonic(): JSX.Element {
  const dispatch = useAppDispatch()

  const [mnemonic, setMnemonic] = useState('')
  const passwordInputProps = usePasswordInput()

  return (
    <Card alignItems="center" backgroundColor="$background0">
      <Stack
        alignItems="center"
        backgroundColor="$background3"
        borderRadius="$rounded16"
        justifyContent="center"
        marginVertical="$spacing8"
        paddingHorizontal="$spacing36"
        paddingVertical="$spacing24"
        space="$spacing24">
        <H2>Import wallet step 2</H2>
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
          <YStack alignItems="center" space="$spacing24">
            <XStack alignItems="center" space="$spacing16">
              <Label htmlFor="password">Password</Label>
              <Input
                secureTextEntry
                id="password"
                maxWidth={180}
                {...passwordInputProps}
              />
            </XStack>

            <XStack alignItems="center" space="$spacing16">
              <Label htmlFor="mnemonic">Mnemonic</Label>
              <Input
                secureTextEntry
                id="mnemonic"
                maxWidth={180}
                value={mnemonic}
                onChangeText={setMnemonic}
              />
            </XStack>
            <Form.Trigger asChild>
              <Button
                fontSize={18}
                fontWeight="400"
                paddingHorizontal="$spacing24"
                paddingVertical="$spacing16">
                Import
              </Button>
            </Form.Trigger>
          </YStack>
        </Form>
      </Stack>
    </Card>
  )
}