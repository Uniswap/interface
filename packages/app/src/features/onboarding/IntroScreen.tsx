import { useState } from 'react'
import { Text } from 'ui/src'
import { useTranslation } from 'react-i18next'
import {
  Button,
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
import { authActions } from '../auth/saga'

const DUMMY_SEED_PHRASE =
  'stereo gain space check elbow say usual help cinnamon inquiry snap expose'

export function IntroScreen(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [mnemonic, setMnemonic] = useState(DUMMY_SEED_PHRASE)
  const [password, setPassword] = useState('')

  return (
    <Card alignItems="center" backgroundColor="$background0">
      <Card.Header padded alignItems="center">
        <Circle backgroundColor="$brandedAccentSoft" height={60} width={60} />
        <H2>{t('Say hello to your new wallet')}</H2>

        <Paragraph>
          {t(
            'It has a public address for making transactions, and a nickname that’s only visible to you.'
          )}
        </Paragraph>
      </Card.Header>

      <Stack
        alignItems="center"
        backgroundColor="$background3"
        borderRadius="$rounded16"
        justifyContent="center"
        margin="$spacing16"
        padding="$spacing36">
        {/* TODO: move to features/auth/locked */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button
          onPress={() => {
            dispatch(authActions.trigger({ password }))
          }}>
          <Text>Unlock</Text>
        </Button>

        <H1>{t('Import wallet')}</H1>

        <Form
          onSubmit={() => {
            dispatch(
              importAccountActions.trigger({
                type: ImportAccountType.Mnemonic,
                validatedMnemonic: mnemonic,
              })
            )
          }}>
          <YStack space="$spacing16">
            <XStack alignItems="center" space="$spacing16">
              <Label htmlFor="mnemonic">Mnemonic</Label>
              <Input
                secureTextEntry
                id="mnemonic"
                value={DUMMY_SEED_PHRASE}
                onChangeText={setMnemonic}
              />
            </XStack>
            <Form.Trigger asChild>
              <Button>{t('Import')}</Button>
            </Form.Trigger>
          </YStack>
        </Form>
      </Stack>

      <Card.Footer />
    </Card>
  )
}
