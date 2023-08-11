import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { TOKEN_BALANCE_ITEM_HEIGHT } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { iconSizes } from 'ui/src/theme/iconSizes'

interface TokenLoaderProps {
  opacity: number
}

export function TokenLoader({ opacity }: TokenLoaderProps): JSX.Element {
  return (
    <Flex
      alignItems="flex-start"
      flexDirection="row"
      justifyContent="space-between"
      minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
      opacity={opacity}
      py="spacing8">
      <Flex row alignItems="center" flexShrink={1} gap="spacing12" overflow="hidden">
        <Box
          bg="surface3"
          borderRadius="roundedFull"
          minHeight={iconSizes.icon40}
          minWidth={iconSizes.icon40}
        />
        <Flex alignItems="flex-start" flexShrink={1} gap="none">
          <Text
            loading="no-shimmer"
            loadingPlaceholderText="Token Full Name"
            numberOfLines={1}
            variant="bodyLarge"
          />
          <Flex row alignItems="center" gap="spacing8" minHeight={20}>
            <Text
              loading="no-shimmer"
              loadingPlaceholderText="1,000 TFN"
              numberOfLines={1}
              variant="subheadSmall"
            />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
