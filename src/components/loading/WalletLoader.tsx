import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'

const HIDDEN_TEXT_HEIGHT = 20

interface Props {
  opacity: number
}

export function WalletLoader({ opacity }: Props) {
  return (
    <Flex
      row
      alignItems="center"
      bg="backgroundOutline"
      borderRadius="lg"
      justifyContent="space-between"
      mb="sm"
      opacity={opacity}
      overflow="hidden"
      p="sm">
      <Flex centered row gap="xs">
        <Box bg="background3" borderRadius="full" height={32} width={32} />
        <Flex shrink alignItems="flex-start" gap="xxs" width="100%">
          <Box bg="background3" borderRadius="xs" minHeight={HIDDEN_TEXT_HEIGHT} width="50%">
            <HiddenFromScreenReaders>
              <Text color="none" opacity={0} variant="bodyLarge">
                Wallet Nickname
              </Text>
            </HiddenFromScreenReaders>
          </Box>
          <Flex row alignItems="center" minHeight={HIDDEN_TEXT_HEIGHT} width="100%">
            <Box bg="background3" borderRadius="xs" width="35%">
              <HiddenFromScreenReaders>
                <Text color="none" opacity={0} variant="subheadSmall">
                  Wallet Address
                </Text>
              </HiddenFromScreenReaders>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
