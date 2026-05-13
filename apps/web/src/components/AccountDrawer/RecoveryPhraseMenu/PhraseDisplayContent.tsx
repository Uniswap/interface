import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeSlash } from 'ui/src/components/icons/EyeSlash'
import { FileListLock } from 'ui/src/components/icons/FileListLock'
import { GraduationCap } from 'ui/src/components/icons/GraduationCap'

function PlaceholderBars({ rowCount }: { rowCount: number }) {
  const perColumn = Math.ceil(rowCount / 2)
  return (
    <Flex row gap="$gap16" flex={1}>
      <Flex flex={1} gap="$gap16" justifyContent="center">
        {Array.from({ length: perColumn }, (_, i) => (
          <Flex key={i} height={10} borderRadius="$rounded4" backgroundColor="$surface3" />
        ))}
      </Flex>
      <Flex flex={1} gap="$gap16" justifyContent="center">
        {Array.from({ length: rowCount - perColumn }, (_, i) => (
          <Flex key={i} height={10} borderRadius="$rounded4" backgroundColor="$surface3" />
        ))}
      </Flex>
    </Flex>
  )
}

function WordGrid({ words }: { words: string[] }) {
  const half = Math.ceil(words.length / 2)
  const left = words.slice(0, half)
  const right = words.slice(half)

  return (
    <Flex row gap="$gap16" flex={1}>
      <Flex flex={1} gap="$gap8" justifyContent="center">
        {left.map((word, i) => (
          <Flex key={i} row gap="$gap8">
            <Text variant="body3" color="$neutral2" width={20}>
              {i + 1}
            </Text>
            <Text variant="body3" color="$neutral1">
              {word}
            </Text>
          </Flex>
        ))}
      </Flex>
      <Flex flex={1} gap="$gap8" justifyContent="center">
        {right.map((word, i) => (
          <Flex key={i} row gap="$gap8">
            <Text variant="body3" color="$neutral2" width={20}>
              {half + i + 1}
            </Text>
            <Text variant="body3" color="$neutral1">
              {word}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

export function PhraseDisplayContent({
  seedPhrase,
  isVisible,
  isCopied,
  onToggleVisibility,
  onCopy,
  onDone,
}: {
  seedPhrase: string | null
  isVisible: boolean
  isCopied: boolean
  onToggleVisibility: () => void
  onCopy: () => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const words = seedPhrase ? seedPhrase.split(' ') : []
  const wordCount = words.length || 12

  return (
    <Flex gap="$gap24" px="$padding8" pb="$padding8" flex={1}>
      <Flex gap="$gap16">
        <Flex
          width={48}
          height={48}
          alignItems="center"
          justifyContent="center"
          backgroundColor="$surface3"
          borderRadius="$rounded12"
        >
          <FileListLock size="$icon.24" color="$neutral2" />
        </Flex>
        <Flex gap="$gap8" pr="$spacing24">
          <Text variant="subheading1" color="$neutral1">
            {t('settings.setting.recoveryPhrase.title')}
          </Text>
          <Text variant="body3" color="$neutral2">
            {t('setting.recoveryPhrase.export.description', { count: wordCount })}
          </Text>
        </Flex>
      </Flex>

      <Flex flex={1} gap="$gap24">
        <Flex gap="$gap16">
          <Flex
            backgroundColor="$surface2"
            borderColor="$surface3"
            borderWidth={1}
            borderRadius="$rounded20"
            px="$padding16"
            py="$spacing24"
          >
            {isVisible && words.length > 0 ? <WordGrid words={words} /> : <PlaceholderBars rowCount={wordCount} />}
          </Flex>

          <Flex row gap="$gap8">
            <Button
              flex={1}
              size="small"
              emphasis="secondary"
              icon={isVisible ? <EyeSlash size="$icon.20" /> : <Eye size="$icon.20" />}
              onPress={onToggleVisibility}
            >
              {isVisible ? t('common.button.hide') : t('common.button.show')}
            </Button>
            <Button
              flex={1}
              size="small"
              emphasis="secondary"
              icon={isCopied ? <Check size="$icon.20" color="$statusSuccess" /> : <CopySheets size="$icon.20" />}
              onPress={onCopy}
            >
              <Text variant="buttonLabel3" color={isCopied ? '$statusSuccess' : '$neutral1'}>
                {isCopied ? t('common.copied') : t('common.button.copy')}
              </Text>
            </Button>
          </Flex>
        </Flex>

        <Flex row backgroundColor="$surface2" borderRadius="$rounded16" p="$padding16" gap="$gap12" alignItems="center">
          <GraduationCap size={20} color="$neutral2" flexShrink={0} />
          <Text variant="body4" color="$neutral1" flex={1}>
            {t('setting.recoveryPhrase.export.suggestWriteDown')}
          </Text>
        </Flex>
      </Flex>
      <Flex row justifyContent="center" alignSelf="stretch">
        <Button emphasis="primary" size="medium" onPress={onDone}>
          {t('common.button.done')}
        </Button>
      </Flex>
    </Flex>
  )
}
