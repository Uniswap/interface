import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingRoutes } from 'src/app/navigation/constants'
import { Input, Stack, XStack, YStack } from 'tamagui'
import { Text } from 'ui/src'
import { Button, LinkButton } from 'ui/src/components/button/Button'
import { validateMnemonic } from 'wallet/src/utils/mnemonics'

export function ImportMnemonic(): JSX.Element {
  const navigate = useNavigate()

  const [mnemonic, setMnemonic] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = (e: any): void => {
    // TODO: validate mnemonic and give the button a disabled state when there is no mnemonic
    // Consider reusing logic from apps/mobile/**/SeedPhraseInputScreen
    if (!validateMnemonic(mnemonic)) {
      e.preventDefault()
    }
  }

  return (
    <Stack alignItems="center" gap="$spacing36" minWidth={450}>
      <YStack alignItems="center" gap="$spacing8">
        <Text variant="headlineMedium">Enter your recovery phrase</Text>
        <Text variant="subheadSmall">
          Your recovery phrase will only be stored locally on your browser
        </Text>
      </YStack>
      <Input
        secureTextEntry
        backgroundColor="$background1"
        borderColor="$backgroundOutline"
        borderRadius="$rounded12"
        borderWidth={1}
        focusStyle={styles.inputFocus}
        height="auto"
        hoverStyle={styles.inputHover}
        id="mnemonic"
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing12"
        placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
        placeholderTextColor="$textTertiary"
        value={mnemonic}
        width="100%"
        onChangeText={setMnemonic}
      />
      <XStack gap="$spacing12" width="100%">
        <Button flexGrow={1} theme="secondary" onPress={(): void => navigate(-1)}>
          Back
        </Button>
        <LinkButton
          disabled={!mnemonic}
          // this gets passed down to the button component the Link wraps
          flexGrow={1}
          // this applies to the Link component itself
          linkStyleProps={{ style: { flexGrow: 1 } }}
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

const styles = {
  inputFocus: { borderWidth: 1, borderColor: '$textTertiary', outlineWidth: 0 },
  inputHover: { borderWidth: 1, borderColor: '$background3', outlineWidth: 0 },
}
