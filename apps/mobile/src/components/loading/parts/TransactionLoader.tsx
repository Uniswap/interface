import React from 'react'
import { Flex, Text } from 'ui/src'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'

interface TransactionLoaderProps {
  opacity: number
}

export function TransactionLoader({ opacity }: TransactionLoaderProps): JSX.Element {
  return (
    <Flex opacity={opacity} overflow="hidden">
      <Flex grow row alignItems="flex-start" gap="$spacing16" justifyContent="space-between" py="$spacing12">
        <Flex row shrink alignItems="center" gap="$spacing12" height="100%" justifyContent="flex-start">
          <Flex
            centered
            backgroundColor="$neutral3"
            borderRadius="$roundedFull"
            height={TXN_HISTORY_ICON_SIZE}
            width={TXN_HISTORY_ICON_SIZE}
          />
          <Flex shrink>
            <Flex row alignItems="center" gap="$spacing4">
              <Text
                loading="no-shimmer"
                loadingPlaceholderText="Contract Interaction"
                numberOfLines={1}
                variant="body1"
              />
            </Flex>
            <Text loading="no-shimmer" loadingPlaceholderText="Caption Text" numberOfLines={1} variant="subheading2" />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
