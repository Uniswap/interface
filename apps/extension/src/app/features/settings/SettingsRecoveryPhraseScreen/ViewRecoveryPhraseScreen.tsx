import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import { CopyButton } from 'src/app/components/buttons/CopyButton'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { EnterPasswordModal } from 'src/app/features/settings/password/EnterPasswordModal'
import { SettingsRecoveryPhrase } from 'src/app/features/settings/SettingsRecoveryPhraseScreen/SettingsRecoveryPhrase'
import { AppRoutes, RemoveRecoveryPhraseRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Button, Flex, Separator, Text } from 'ui/src'
import { AlertTriangle, Eye, Key, Laptop } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { setClipboard } from 'wallet/src/utils/clipboard'

const enum ViewStep {
  Warning,
  Password,
  Reveal,
}

export function SettingsViewRecoveryPhraseScreen(): JSX.Element {
  const { t } = useTranslation()

  const [viewStep, setViewStep] = useState(ViewStep.Warning)

  const mnemonicAccounts = useSignerAccounts()
  const mnemonicAccount = mnemonicAccounts[0]
  if (!mnemonicAccount) {
    throw new Error('Screen should not be accessed unless mnemonic account exists')
  }

  const placeholderWordArrayLength = 12

  const recoveryPhraseString = useAsyncData(
    useCallback(async () => Keyring.retrieveMnemonicUnlocked(mnemonicAccount.mnemonicId), [mnemonicAccount.mnemonicId]),
  ).data
  const recoveryPhraseArray = recoveryPhraseString?.split(' ') ?? Array(placeholderWordArrayLength).fill('')

  const onCopyPress = async (): Promise<void> => {
    try {
      if (recoveryPhraseString) {
        await setClipboard(recoveryPhraseString)
      }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'SettingsViewRecoveryPhraseScreen.tsx', function: 'onCopyPress' },
      })
    }
  }

  const showPasswordModal = (): void => {
    setViewStep(ViewStep.Password)
  }

  useEffect(() => {
    sendAnalyticsEvent(WalletEventName.ViewRecoveryPhrase)

    // Clear clipboard when the component unmounts
    return () => {
      navigator.clipboard.writeText('').catch((error) => {
        logger.error(error, {
          tags: { file: 'SettingsViewRecoveryPhraseScreen.tsx', function: 'maybeClearClipboard' },
        })
      })
    }
  }, [])

  return (
    <Flex grow backgroundColor="$surface1">
      <ScreenHeader title={t('settings.setting.recoveryPhrase.title')} />
      {viewStep !== ViewStep.Reveal ? (
        <SettingsRecoveryPhrase
          icon={<AlertTriangle color="$statusCritical" size="$icon.24" />}
          nextButtonEnabled={true}
          nextButtonText={t('common.button.continue')}
          nextButtonTheme="secondary_Button"
          subtitle={t('setting.recoveryPhrase.view.warning.message1')}
          title={t('setting.recoveryPhrase.view.warning.title')}
          onNextPressed={showPasswordModal}
        >
          {viewStep === ViewStep.Password && (
            <EnterPasswordModal
              onClose={() => setViewStep(ViewStep.Warning)}
              onNext={() => setViewStep(ViewStep.Reveal)}
            />
          )}
          <Flex
            alignItems="flex-start"
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth="$spacing1"
            gap="$spacing24"
            p="$spacing12"
          >
            <Flex row alignItems="center" gap="$spacing12">
              <Flex p={6}>
                <Eye color="$statusCritical" size="$icon.24" />
              </Flex>
              <Text textAlign="left" variant="body2">
                {t('setting.recoveryPhrase.view.warning.message2')}
              </Text>
            </Flex>
            <Flex row alignItems="center" gap="$spacing12" width="100%">
              <Flex p={6}>
                <Key color="$statusCritical" size="$icon.24" />
              </Flex>
              <Text textAlign="left" variant="body2">
                {t('setting.recoveryPhrase.view.warning.message3')}
              </Text>
            </Flex>
            <Flex row alignItems="center" gap="$spacing12">
              <Flex p={6}>
                <Laptop color="$statusCritical" size="$icon.24" />
              </Flex>
              <Text textAlign="left" variant="body2">
                {t('setting.recoveryPhrase.view.warning.message4')}
              </Text>
            </Flex>
          </Flex>
        </SettingsRecoveryPhrase>
      ) : (
        <Flex fill gap="$spacing24" pt="$spacing36">
          <Flex
            backgroundColor="$surface2"
            borderColor="$surface3"
            borderRadius="$rounded16"
            borderWidth={1}
            gap="$spacing12"
            width="100%"
          >
            <Flex fill row pb="$spacing24" pt="$spacing32" px="$spacing24">
              <SeedPhraseColumnGroup recoveryPhraseArray={recoveryPhraseArray} />
            </Flex>
            <Flex alignItems="center" position="absolute" top={-1 * spacing.spacing16} width="100%">
              <CopyButton onCopyPress={onCopyPress} />
            </Flex>
          </Flex>
          <Flex alignItems="center" gap="$spacing8">
            <Text color="$neutral2" textAlign="center" variant="body3">
              {t('setting.recoveryPhrase.warning.view.message')}
            </Text>
          </Flex>
          <Flex fill justifyContent="flex-end">
            <Button
              theme="detrimental"
              onPress={(): void =>
                navigate(
                  `${AppRoutes.Settings}/${SettingsRoutes.RemoveRecoveryPhrase}/${RemoveRecoveryPhraseRoutes.Wallets}`,
                  { replace: true },
                )
              }
            >
              {t('setting.recoveryPhrase.remove')}
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

function SeedPhraseColumnGroup({ recoveryPhraseArray }: { recoveryPhraseArray: string[] }): JSX.Element {
  const [largestIndexWidth, setLargestIndexWidth] = useState(0)

  const halfLength = recoveryPhraseArray.length / 2
  const firstHalfWords = recoveryPhraseArray.slice(0, halfLength)
  const secondHalfWords = recoveryPhraseArray.slice(halfLength)

  const onIndexLayout = (event: LayoutChangeEvent): void => {
    const { width } = event.nativeEvent.layout
    if (width > largestIndexWidth) {
      setLargestIndexWidth(width)
    }
  }

  return (
    <Flex grow row gap="$spacing16" justifyContent="space-between">
      <SeedPhraseColumn
        indexOffset={1}
        largestIndexWidth={largestIndexWidth}
        words={firstHalfWords}
        onIndexLayout={onIndexLayout}
      />
      <Separator vertical borderWidth="$spacing1" />
      <SeedPhraseColumn
        indexOffset={halfLength + 1}
        largestIndexWidth={largestIndexWidth}
        words={secondHalfWords}
        onIndexLayout={onIndexLayout}
      />
    </Flex>
  )
}

function SeedPhraseColumn({
  words,
  indexOffset,
  largestIndexWidth,
  onIndexLayout,
}: {
  words: string[]
  indexOffset: number
  largestIndexWidth: number
  onIndexLayout: (event: LayoutChangeEvent) => void
}): JSX.Element {
  return (
    <Flex fill gap="$spacing16">
      {words.map((word, index) => (
        <SeedPhraseWord
          key={index}
          index={index + indexOffset}
          indexMinWidth={largestIndexWidth}
          word={word}
          onIndexLayout={onIndexLayout}
        />
      ))}
    </Flex>
  )
}

function SeedPhraseWord({
  index,
  word,
  indexMinWidth,
  onIndexLayout,
}: {
  index: number
  word: string
  indexMinWidth: number
  onIndexLayout: (event: LayoutChangeEvent) => void
}): JSX.Element {
  return (
    <Flex key={index} row gap="$spacing12">
      <Text color="$neutral3" minWidth={indexMinWidth} variant="body2" onLayout={onIndexLayout}>
        {index}
      </Text>
      <Text variant="body2">{word}</Text>
    </Flex>
  )
}
