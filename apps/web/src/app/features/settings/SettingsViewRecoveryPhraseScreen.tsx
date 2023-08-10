import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HideContentShield } from 'src/app/components/hideContent/HideContentShield'
import { BackButtonHeader } from 'src/app/features/settings/BackButtonHeader'
import { Text, XStack, YStack } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import { Flex } from 'ui/src/components/layout/Flex'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useAsyncData } from 'utilities/src/react/hooks'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { useNonPendingSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

export function SettingsViewRecoveryPhraseScreen(): JSX.Element {
  const { t } = useTranslation()
  const mnemonicAccounts = useNonPendingSignerAccounts()
  const mnemonicAccount = mnemonicAccounts[0] as SignerMnemonicAccount
  if (!mnemonicAccount) {
    throw new Error('Screen should not be accessed unless mnemonic account exists')
  }
  const recoveryPhraseArray =
    useAsyncData(
      useCallback(
        async () => Keyring.retrieveMnemonicUnlocked(mnemonicAccount.mnemonicId),
        [mnemonicAccount.mnemonicId]
      )
    ).data?.split(' ') ?? []
  const halfLength = recoveryPhraseArray.length / 2
  const firstHalfWords = recoveryPhraseArray.slice(0, halfLength)
  const secondHalfWords = recoveryPhraseArray.slice(halfLength)
  const [showPhrase, setShowPhrase] = useState(false)

  return (
    <YStack backgroundColor="$surface1" flexGrow={1} padding="$spacing12">
      <BackButtonHeader headerText={t('Recovery phrase')} />
      <YStack gap="$spacing24" padding="$spacing12">
        <Flex position="relative" onHoverOut={(): void => setShowPhrase(false)}>
          <YStack
            backgroundColor="$surface2"
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
          <HideContentShield
            color="$surface2"
            visibility={showPhrase}
            onShowContent={(): void => setShowPhrase(true)}
          />
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
          <Text color="$neutral3" variant="bodySmall">
            {index + indexOffset}
          </Text>
          <Text variant="bodySmall">{word}</Text>
        </XStack>
      ))}
    </YStack>
  )
}
