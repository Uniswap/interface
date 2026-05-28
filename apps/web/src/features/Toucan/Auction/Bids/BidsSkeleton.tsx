import { Flex, Skeleton } from 'ui/src'

function BidItemSkeleton(): JSX.Element {
  return (
    <Flex
      width="100%"
      borderRadius="$rounded12"
      backgroundColor="$surface2"
      px="$spacing12"
      py="$spacing12"
      gap="$spacing8"
    >
      {/* Line 1: Status indicator + Budget info + timestamp */}
      <Flex row alignItems="center" gap="$spacing4">
        {/* Status indicator dot */}
        <Skeleton>
          <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor="$neutral3" />
        </Skeleton>
        {/* Budget amount */}
        <Skeleton>
          <Flex width={60} height={16} borderRadius="$rounded4" backgroundColor="$neutral3" />
        </Skeleton>
        {/* Budget fiat */}
        <Skeleton>
          <Flex width={50} height={16} borderRadius="$rounded4" backgroundColor="$neutral3" />
        </Skeleton>
        {/* @ FDV */}
        <Skeleton>
          <Flex width={80} height={16} borderRadius="$rounded4" backgroundColor="$neutral3" />
        </Skeleton>
        {/* Spacer */}
        <Flex flex={1} />
        {/* Timestamp */}
        <Skeleton>
          <Flex width={40} height={16} borderRadius="$rounded4" backgroundColor="$neutral3" />
        </Skeleton>
      </Flex>

      {/* Line 2: Progress bar (matches BidProgressBar layout) */}
      <Flex height={14} alignItems="center" marginTop={3} flex={1}>
        <Skeleton>
          <Flex width="100%" height={8} borderRadius="$roundedFull" backgroundColor="$neutral3" />
        </Skeleton>
      </Flex>
    </Flex>
  )
}

export function BidsSkeleton(): JSX.Element {
  return (
    <Flex width="100%" gap="$spacing4">
      <BidItemSkeleton />
      <BidItemSkeleton />
      <BidItemSkeleton />
    </Flex>
  )
}
