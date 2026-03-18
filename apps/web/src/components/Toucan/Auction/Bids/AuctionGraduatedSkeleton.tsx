import { Flex, Skeleton } from 'ui/src'

export function AuctionGraduatedSkeleton(): JSX.Element {
  return (
    <Flex gap="$spacing8" width="100%">
      {/* Main card skeleton */}
      <Flex
        position="relative"
        overflow="hidden"
        borderRadius="$rounded24"
        borderWidth={1}
        borderColor="$surface3"
        backgroundColor="$surface1"
        minHeight={344}
        width="100%"
        justifyContent="center"
        alignItems="center"
      >
        {/* Token logo skeleton */}
        <Flex position="absolute" left="calc(50% - 32px)" top={56}>
          <Skeleton>
            <Flex width={64} height={64} borderRadius="$roundedFull" backgroundColor="$neutral3" />
          </Skeleton>
        </Flex>

        {/* Text content skeleton */}
        <Flex gap="$spacing8" alignItems="center" justifyContent="center" width="100%" px="$spacing20">
          {/* "You received" label */}
          <Skeleton>
            <Flex width={80} height={20} borderRadius="$rounded4" backgroundColor="$neutral3" mt={100} />
          </Skeleton>
          {/* Token amount */}
          <Skeleton>
            <Flex width={180} height={32} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
          {/* Average price */}
          <Skeleton>
            <Flex width={140} height={20} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
          {/* Percentage below clearing */}
          <Skeleton>
            <Flex width={160} height={20} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
        </Flex>
      </Flex>

      {/* View My Bids button skeleton */}
      <Skeleton>
        <Flex width="100%" height={40} borderRadius="$rounded16" backgroundColor="$neutral3" />
      </Skeleton>

      {/* Withdraw Tokens button skeleton */}
      <Skeleton>
        <Flex width="100%" height={48} borderRadius="$rounded16" backgroundColor="$neutral3" />
      </Skeleton>
    </Flex>
  )
}
