import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HideContentShield } from 'src/app/components/hideContent/HideContentShield'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { Flex, Text } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import { iconSizes } from 'ui/src/theme'
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

  const placeholderWordArrayLength = 12

  const recoveryPhraseArray =
    useAsyncData(
      useCallback(
        async () => Keyring.retrieveMnemonicUnlocked(mnemonicAccount.mnemonicId),
        [mnemonicAccount.mnemonicId]
      )
    ).data?.split(' ') ?? Array(placeholderWordArrayLength).fill('')

  const halfLength = recoveryPhraseArray.length / 2
  const firstHalfWords = recoveryPhraseArray.slice(0, halfLength)
  const secondHalfWords = recoveryPhraseArray.slice(halfLength)
  const [showPhrase, setShowPhrase] = useState(false)

  return (
    <Flex grow bg="$surface1" gap="$spacing12">
      <ScreenHeader title={t('Recovery phrase')} />
      <Flex gap="$spacing24" p="$spacing12">
        <Flex position="relative" onHoverOut={(): void => setShowPhrase(false)}>
          <Flex
            fill
            bg="$surface2"
            borderRadius="$rounded16"
            gap="$spacing12"
            p="$spacing24"
            width="100%">
            <Flex fill row>
              <SeedPhraseColumn indexOffset={1} words={firstHalfWords} />
              <SeedPhraseColumn indexOffset={halfLength + 1} words={secondHalfWords} />
            </Flex>
          </Flex>
          <HideContentShield
            color="$surface2"
            visibility={showPhrase}
            onShowContent={(): void => {
              // TODO: add better loading state of seed phrase words
              if (!recoveryPhraseArray.includes('')) {
                setShowPhrase(true)
              }
            }}
          />
        </Flex>

        <Flex alignItems="center" gap="$spacing8">
          <Flex row alignItems="center" gap="$spacing8">
            {/* TODO: Replace with proper color once available */}
            <AlertTriangleIcon color="#FF5F52" height={iconSizes.icon24} width={iconSizes.icon24} />
            <Text color="#FF5F52" variant="subheading2">
              {t('View in private')}
            </Text>
          </Flex>
          <Text textAlign="center" variant="body2">
            {t('Anyone who knows your recovery phrase can access your wallet and funds.')}
          </Text>
        </Flex>
      </Flex>
    </Flex>
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
    <Flex fill gap="$spacing16">
      {words.map((word, index) => (
        <SeedPhraseWord key={index} index={index + indexOffset} word={word} />
      ))}
    </Flex>
  )
}

function SeedPhraseWord({ index, word }: { index: number; word: string }): JSX.Element {
  return (
    <Flex key={index} gap="$spacing12">
      <Text color="$neutral3" variant="body2">
        {index}
      </Text>
      <Text variant="body2">{word}</Text>
    </Flex>
  )
}
