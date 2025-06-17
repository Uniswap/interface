import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { CopyButton } from 'src/app/components/buttons/CopyButton'
import { Flex, Separator, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { logger } from 'utilities/src/logger/logger'
import { mnemonicUnlockedQuery } from 'wallet/src/features/wallet/Keyring/queries'

function SeedPhraseColumnGroup({ recoveryPhraseArray }: { recoveryPhraseArray: string[] }): JSX.Element {
  const [largestIndexWidth, setLargestIndexWidth] = useState(0)

  const halfLength = Math.ceil(recoveryPhraseArray.length / 2)
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
      <Separator vertical />
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
      <Text variant="body2" className="notranslate">
        {word}
      </Text>
    </Flex>
  )
}

export function SeedPhraseDisplay({ mnemonicId }: { mnemonicId: string }): JSX.Element {
  const placeholderWordArrayLength = 12

  const { data: recoveryPhraseString } = useQuery(mnemonicUnlockedQuery(mnemonicId))
  const recoveryPhraseArray = recoveryPhraseString?.split(' ') ?? Array(placeholderWordArrayLength).fill('')

  const onCopyPress = async (): Promise<void> => {
    try {
      if (recoveryPhraseString) {
        await setClipboard(recoveryPhraseString)
      }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'SeedPhraseDisplay', function: 'onCopyPress' },
      })
    }
  }

  useEffect(() => {
    sendAnalyticsEvent(WalletEventName.ViewRecoveryPhrase)

    // Clear clipboard when the component unmounts
    return () => {
      navigator.clipboard.writeText('').catch((error) => {
        logger.error(error, {
          tags: { file: 'SeedPhraseDisplay.tsx', function: 'navigator.clipboard.writeText' },
        })
      })
    }
  }, [])

  return (
    <Flex
      backgroundColor="$surface2"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
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
  )
}
