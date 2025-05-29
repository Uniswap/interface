import { useCallback, useEffect, useMemo } from 'react'
import { CopyButton } from 'src/app/components/buttons/CopyButton'
import { Flex, Text, useMedia } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'

const ROW_SIZE = 3

export const MnemonicViewer = ({ mnemonic }: { mnemonic?: string[] }): JSX.Element => {
  const media = useMedia()
  const px = media.xxs ? '$spacing12' : '$spacing32'

  const onCopyPress = useCallback(async () => {
    if (!mnemonic) {
      return
    }
    const mnemonicString = mnemonic.join(' ')
    try {
      if (mnemonicString) {
        await navigator.clipboard.writeText(mnemonicString)
      }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'MnemonicViewer.tsx', function: 'onCopyPress' },
      })
    }
  }, [mnemonic])

  useEffect(() => {
    return () => {
      navigator.clipboard.writeText('').catch((error) => {
        logger.error(error, {
          tags: { file: 'MnemonicViewer.tsx', function: 'MnemonicViewer#useEffect' },
        })
      })
    }
  }, [])

  const rows = useMemo(() => {
    if (!mnemonic) {
      return null
    }
    const elements = []
    for (let i = 0; i < mnemonic.length; i += ROW_SIZE) {
      elements.push(<SeedPhraseRow key={i} startIndex={i + 1} words={mnemonic.slice(i, i + ROW_SIZE)} />)
    }
    return elements
  }, [mnemonic])

  return (
    <Flex
      backgroundColor="$surface2"
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      gap="$spacing12"
      position="relative"
      px={px}
      py="$spacing24"
      width="100%"
    >
      {rows}
      <Flex alignItems="center" left="50%" position="absolute" top={-16} transform="translateX(-50%)">
        <CopyButton onCopyPress={onCopyPress} />
      </Flex>
    </Flex>
  )
}

function SeedPhraseRow({ words, startIndex }: { words: string[]; startIndex: number }): JSX.Element {
  return (
    <Flex fill row>
      {words.map((word, index) => (
        <SeedPhraseWord key={index} index={index + startIndex} word={word} />
      ))}
    </Flex>
  )
}

function SeedPhraseWord({ index, word }: { index: number; word: string }): JSX.Element {
  const media = useMedia()
  const fontVariant = 'body3'
  const gap = media.xxs ? '$spacing4' : '$spacing8'
  return (
    <Flex fill row flexBasis={0} gap={gap}>
      <Text color="$neutral3" minWidth={16} variant={fontVariant}>
        {index}
      </Text>
      <Text variant={fontVariant}>{word}</Text>
    </Flex>
  )
}
