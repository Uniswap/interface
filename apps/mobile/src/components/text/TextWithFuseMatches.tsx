import Fuse from 'fuse.js'
import React from 'react'
import { TextProps } from 'react-native'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'ui/src/theme/restyle'

interface TextWithFuseMatchesProps {
  text: string
  matches?: readonly Fuse.FuseResultMatch[]
  variant?: keyof Theme['textVariants']
  numberOfLines?: TextProps['numberOfLines']
}

export function TextWithFuseMatches({
  matches,
  text,
  variant = 'bodyLarge',
  numberOfLines = 1,
}: TextWithFuseMatchesProps & TextProps): JSX.Element {
  if (!matches || matches.length === 0) {
    return (
      <Text color="neutral1" numberOfLines={numberOfLines} variant={variant}>
        {text}
      </Text>
    )
  }

  const charIsMatch = new Set()
  for (const match of matches) {
    for (const index of match.indices) {
      for (let i = index[0]; i < index[1] + 1; i++) {
        charIsMatch.add(i)
      }
    }
  }

  // PERF: batch pieces?
  const pieces = []
  for (let i = 0; i < text.length; i++) {
    if (charIsMatch.has(i)) {
      pieces.push([text[i], true])
    } else {
      pieces.push([text[i], false])
    }
  }

  const elements = (
    <>
      {pieces.map((p, i) => {
        if (p[1])
          return (
            <Text key={`${i}${p[0]}`} color="neutral1" variant={variant}>
              {p[0]}
            </Text>
          )
        else
          return (
            <Text key={`${i}${p[0]}`} color="neutral3" variant={variant}>
              {p[0]}
            </Text>
          )
      })}
    </>
  )

  return <Flex row>{elements}</Flex>
}
