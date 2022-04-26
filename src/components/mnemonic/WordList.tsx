import React from 'react'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { WordPill } from 'src/components/mnemonic/WordPill'

interface WordListProps {
  mnemonic: string[]
  unavailable: Set<Nullable<string>>
  onPressWord: (word: string) => void
}

/** Renders an interactive list of words composing a mnemonic */
export function WordList({ onPressWord, unavailable, mnemonic: words }: WordListProps) {
  return (
    <Flex row flexWrap="wrap" gap="xs">
      {words.map((w, i) => (
        <TextButton
          key={i}
          disabled={Boolean(unavailable.has(w))}
          mb="xs"
          opacity={unavailable.has(w) ? 0.2 : 1}
          onPress={() => {
            onPressWord(w)
          }}>
          <WordPill disabled={unavailable.has(w)} label={w} />
        </TextButton>
      ))}
    </Flex>
  )
}
