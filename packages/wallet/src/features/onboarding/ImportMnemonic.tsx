import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Stack, XStack } from 'tamagui'
import { Text } from 'ui/src'
import { Button, LinkButton } from 'ui/src/components/button/Button'
import { OnboardingRoutes } from 'wallet/src/navigation/constants'

export function ImportMnemonic(): JSX.Element {
  const navigate = useNavigate()

  const [mnemonic, setMnemonic] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = (e: any): void => {
    // TODO: validate mnemonic and give the button a disabled state when there is no mnemonic
    if (!mnemonic) {
      e.preventDefault()
    }
  }

  return (
    <Stack alignItems="center">
      <Text variant="headlineMedium">Enter your recovery phrase</Text>
      <Text variant="subheadSmall">
        Your recovery phrase will only be stored locally on your browser
      </Text>
      <Input
        secureTextEntry
        id="mnemonic"
        maxWidth={180}
        value={mnemonic}
        onChangeText={setMnemonic}
      />
      <XStack>
        <Button theme="secondary" onPress={(): void => navigate(-1)}>
          Cancel
        </Button>
        <LinkButton
          state={{ data: { mnemonic, from: OnboardingRoutes.Import } }}
          theme="primary"
          to={`../${OnboardingRoutes.Password}`}
          onClick={handleClick}>
          Next
        </LinkButton>
      </XStack>
    </Stack>
  )
}
