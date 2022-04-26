import React from 'react'
import { Flex } from 'src/components/layout'
import { WordPill } from 'src/components/mnemonic/WordPill'

interface MnemonicDisplayProps {
  mnemonic: Array<string | undefined>
  activePosition?: number
}

export function MnemonicDisplay({ mnemonic, activePosition }: MnemonicDisplayProps) {
  const half = Math.floor(mnemonic.length / 2)
  return (
    <Flex row justifyContent="space-between">
      <Flex fill gap="sm">
        {[...Array(half)].map((_, i) => (
          <WordPill
            key={`mnemonic-${i}`}
            active={i === activePosition}
            label={mnemonic[i]}
            position={i + 1}
          />
        ))}
      </Flex>
      <Flex fill gap="sm">
        {[...Array(half)].map((_, i) => {
          const position = i + half
          return (
            <WordPill
              key={`mnemonic-${position}`}
              active={position === activePosition}
              label={mnemonic[position]}
              position={position + 1}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
