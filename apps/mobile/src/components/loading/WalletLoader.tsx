import React from 'react'
import { ADDRESS_WRAPPER_HEIGHT } from 'src/features/import/WalletPreviewCard'
import { Flex, Text } from 'ui/src'

interface Props {
  opacity: number
}

export function WalletLoader({ opacity }: Props): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      borderColor="$neutral3"
      borderRadius="$rounded20"
      borderWidth={1}
      justifyContent="flex-start"
      opacity={opacity}
      overflow="hidden"
      px="$spacing16"
      py="$spacing16"
      sentry-label="WalletLoader">
      <Flex row alignItems="center" gap="$spacing12" height={ADDRESS_WRAPPER_HEIGHT}>
        <Flex bg="$neutral3" borderRadius="$roundedFull" height={32} width={32} />
        <Flex alignItems="flex-start" width="100%">
          <Text loading loadingPlaceholderText="Wallet Nickname" variant="body1" />
          <Text loading loadingPlaceholderText="0xaaaa...aaaa" variant="subheading2" />
        </Flex>
      </Flex>
    </Flex>
  )
}
