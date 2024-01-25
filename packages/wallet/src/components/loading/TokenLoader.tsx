import React from 'react'
import { Skeleton } from 'ui/src'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { iconSizes } from 'ui/src/theme'
import { TOKEN_BALANCE_ITEM_HEIGHT } from 'wallet/src/features/portfolio/TokenBalanceItem'

interface TokenLoaderProps {
  repeat?: number
  contrast?: boolean
}

export function TokenLoader({ repeat = 1, contrast }: TokenLoaderProps): JSX.Element {
  return (
    <Skeleton contrast={contrast}>
      <Flex grow gap="$spacing4">
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <Flex
              alignItems="flex-start"
              flexDirection="row"
              justifyContent="space-between"
              minHeight={TOKEN_BALANCE_ITEM_HEIGHT}
              opacity={(length - i) / length}
              py="$spacing8">
              <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
                <Flex
                  bg="$neutral3"
                  borderRadius="$roundedFull"
                  minHeight={iconSizes.icon40}
                  minWidth={iconSizes.icon40}
                />
                <Flex shrink alignItems="flex-start">
                  <Text
                    loading="no-shimmer"
                    loadingPlaceholderText="Token Full Name"
                    numberOfLines={1}
                    variant="body1"
                  />
                  <Flex row alignItems="center" gap="$spacing8" minHeight={20}>
                    <Text
                      loading="no-shimmer"
                      loadingPlaceholderText="1,000 TFN"
                      numberOfLines={1}
                      variant="subheading2"
                    />
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </React.Fragment>
        ))}
      </Flex>
    </Skeleton>
  )
}
