import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackButtonHeader } from 'src/app/features/settings/BackButtonHeader'
import { Text, XStack, YStack } from 'ui'
import AlertTriangleIcon from 'ui/assets/icons/alert-triangle.svg'
import EyeOffIcon from 'ui/assets/icons/eye-off.svg'
import { Button } from 'ui/components/button/Button'
import { Flex } from 'ui/components/layout/Flex'
import { colorsDark } from 'ui/theme/color'
import { iconSizes } from 'ui/theme/iconSizes'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { useAsyncData } from 'wallet/src/utils/hooks'

export function SettingsViewRecoveryPhraseScreen(): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow() // TODO: pass in address through navigation since this doesn't have to be active account at all times

  const recoveryPhraseArray =
    useAsyncData(
      useCallback(
        async () => Keyring.retrieveMnemonicUnlocked(activeAccount.address),
        [activeAccount.address]
      )
    ).data?.split(' ') ?? []
  const halfLength = recoveryPhraseArray.length / 2
  const firstHalfWords = recoveryPhraseArray.slice(0, halfLength)
  const secondHalfWords = recoveryPhraseArray.slice(halfLength)
  const [showPhrase, setShowPhrase] = useState(false)

  return (
    <YStack backgroundColor="$background0" flexGrow={1} padding="$spacing12">
      <BackButtonHeader headerText={t('Recovery phrase')} />
      <YStack gap="$spacing24" padding="$spacing12">
        <Flex position="relative" onHoverOut={(): void => setShowPhrase(false)}>
          <YStack
            backgroundColor="$background1"
            borderRadius="$rounded16"
            flex={1}
            gap="$spacing12"
            padding="$spacing24"
            width="100%">
            <XStack flex={1}>
              <SeedPhraseColumn indexOffset={1} words={firstHalfWords} />
              <SeedPhraseColumn indexOffset={halfLength + 1} words={secondHalfWords} />
            </XStack>
          </YStack>
          <Flex
            alignItems="center"
            backgroundColor="$background1"
            borderRadius="$rounded16"
            gap="$spacing16"
            height="100%"
            justifyContent="center"
            opacity={showPhrase ? 0 : 1}
            position="absolute"
            width="100%">
            <EyeOffIcon
              color={colorsDark.textSecondary}
              height={iconSizes.icon64}
              width={iconSizes.icon64}
            />
            <Button
              backgroundColor={colorsDark.background3}
              borderRadius="$rounded12"
              paddingHorizontal="$spacing12"
              paddingVertical="$spacing4"
              onPress={(): void => setShowPhrase(true)}>
              {t('Reveal')}
            </Button>
          </Flex>
        </Flex>

        <YStack alignItems="center" gap="$spacing8">
          <XStack alignItems="center" gap="$spacing8">
            {/* TODO: Replace with proper color once available */}
            <AlertTriangleIcon color="#FF5F52" height={iconSizes.icon24} width={iconSizes.icon24} />
            <Text color="#FF5F52" variant="subheadSmall">
              {t('View in private')}
            </Text>
          </XStack>
          <Text textAlign="center" variant="bodySmall">
            {t('Anyone who knows your recovery phrase can access your wallet and funds.')}
          </Text>
        </YStack>
      </YStack>
    </YStack>
  )
}

function SeedPhraseColumn({
  words,
  indexOffset,
}: {
  words: string[]
  indexOffset: number
}): JSX.Element {
  return (
    <YStack flex={1} gap="$spacing16">
      {words.map((word, index) => (
        <XStack key={index} gap="$spacing12">
          <Text color="$textTertiary" variant="bodySmall">
            {index + indexOffset}
          </Text>
          <Text variant="bodySmall">{word}</Text>
        </XStack>
      ))}
    </YStack>
  )
}
