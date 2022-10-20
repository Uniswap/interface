import React from 'react'
import { FlexAlignType } from 'react-native'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

interface TokenMetadataProps {
  pre?: React.ReactNode
  main: React.ReactNode
  sub?: React.ReactNode
  align?: FlexAlignType
}

/** Helper component to format rhs metadata for a given token. */
export const TokenMetadata = ({ pre, main, sub, align = 'flex-end' }: TokenMetadataProps) => {
  return (
    <Flex row>
      {pre}
      <Flex alignItems={align} gap="xxs" minWidth={70}>
        <Text variant="bodyLarge">{main}</Text>
        {sub}
      </Flex>
    </Flex>
  )
}
