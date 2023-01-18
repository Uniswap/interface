import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ADDRESS_WRAPPER_HEIGHT } from 'src/features/import/WalletPreviewCard'

interface Props {
  opacity: number
}

export function WalletLoader({ opacity }: Props): JSX.Element {
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
          <Text loading loadingPlaceholderText="Wallet Nickname" variant="bodyLarge" />
          <Text loading loadingPlaceholderText="0xaaaa...aaaa" variant="subheadSmall" />
        </Flex>
      </Flex>
    </Flex>
  )
}
