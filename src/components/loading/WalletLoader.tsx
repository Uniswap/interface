import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { HiddenFromScreenReaders } from 'src/components/text/HiddenFromScreenReaders'
import { ADDRESS_WRAPPER_HEIGHT } from 'src/features/import/WalletPreviewCard'

interface Props {
  opacity: number
}

export function WalletLoader({ opacity }: Props) {
  return (
    <Flex
      row
      alignItems="center"
      borderColor="background3"
      borderRadius="lg"
      borderWidth={1}
      justifyContent="flex-start"
      opacity={opacity}
      overflow="hidden"
      px="md"
      py="sm">
      <Flex row alignItems="center" gap="sm" height={ADDRESS_WRAPPER_HEIGHT}>
        <Box bg="background3" borderRadius="full" height={32} width={32} />
        <Flex alignItems="flex-start" gap="none" width="100%">
          <Flex row alignItems="center" width="100%">
            {/* 90% height and the wrapping flex row allow us to get the box to take up exactly the same amount of space as the text, without looking visually weird when the final text layout doesn't have any gap between the header and body text (otherwise it would just be two boxes with no gap between them, OR it would take up more space than the final layout if we add a gap) */}
            <Box bg="background3" borderRadius="xs" height="90%" width="35%">
              <HiddenFromScreenReaders>
                <Text color="none" opacity={0} variant="bodyLarge">
                  Wallet Nickname
                </Text>
              </HiddenFromScreenReaders>
            </Box>
          </Flex>
          <Flex row alignItems="center" width="100%">
            <Box bg="background3" borderRadius="xs" height="90%" width="25%">
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
