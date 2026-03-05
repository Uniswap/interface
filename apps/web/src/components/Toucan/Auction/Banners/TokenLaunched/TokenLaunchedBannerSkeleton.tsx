import { Flex, Skeleton } from 'ui/src'

export function TokenLaunchedBannerSkeleton() {
  return (
    <Flex
      position="relative"
      overflow="hidden"
      borderRadius="$rounded24"
      width="100%"
      px="$spacing24"
      py="$spacing20"
      mt="$spacing32"
      mb="$spacing12"
      backgroundColor="$surface2"
    >
      <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
        <Flex gap="$spacing8" width={240} flexShrink={0}>
          <Skeleton>
            <Flex width={80} height={16} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
          <Skeleton>
            <Flex width={140} height={32} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
          <Skeleton>
            <Flex width={60} height={16} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
        </Flex>
        <Flex gap="$spacing4" alignItems="flex-start" width={240} flexShrink={0} $md={{ display: 'none' }}>
          <Skeleton>
            <Flex width={180} height={24} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
          <Skeleton>
            <Flex width={200} height={20} borderRadius="$rounded4" backgroundColor="$neutral3" />
          </Skeleton>
        </Flex>
      </Flex>
    </Flex>
  )
}
