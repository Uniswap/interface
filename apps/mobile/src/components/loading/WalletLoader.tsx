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
      borderColor="surface3"
      borderRadius="rounded20"
      borderWidth={1}
      justifyContent="flex-start"
      opacity={opacity}
      overflow="hidden"
      px="spacing16"
      py="spacing16"
      sentry-label="WalletLoader">
      <Flex row alignItems="center" gap="spacing12" height={ADDRESS_WRAPPER_HEIGHT}>
        <Box bg="surface3" borderRadius="roundedFull" height={32} width={32} />
        <Flex alignItems="flex-start" gap="none" width="100%">
          <Text loading loadingPlaceholderText="Wallet Nickname" variant="bodyLarge" />
          <Text loading loadingPlaceholderText="0xaaaa...aaaa" variant="subheadSmall" />
        </Flex>
      </Flex>
    </Flex>
  )
}
