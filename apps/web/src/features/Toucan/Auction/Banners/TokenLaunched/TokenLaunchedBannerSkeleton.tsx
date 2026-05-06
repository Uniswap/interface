import { Flex, Skeleton } from 'ui/src'

export function TokenLaunchedBannerSkeleton() {
  return (
    <Flex
      position="relative"
      overflow="hidden"
      borderRadius="$rounded12"
      width="100%"
      px="$spacing24"
      py="$spacing16"
      backgroundColor="$surface2"
    >
      <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
        <Flex row alignItems="center" gap="$spacing12">
          <Skeleton>
            <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor="$neutral3" />
          </Skeleton>
          <Flex gap="$spacing4">
            <Skeleton>
              <Flex width={160} height={14} borderRadius="$rounded4" backgroundColor="$neutral3" />
            </Skeleton>
            <Skeleton>
              <Flex width={100} height={20} borderRadius="$rounded4" backgroundColor="$neutral3" />
            </Skeleton>
          </Flex>
        </Flex>
        <Flex gap="$spacing4" alignItems="flex-end" $md={{ display: 'none' }}>
          <Skeleton>
            <Flex width={80} height={14} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
          <Skeleton>
            <Flex width={100} height={24} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
        </Flex>
      </Flex>
    </Flex>
  )
}
