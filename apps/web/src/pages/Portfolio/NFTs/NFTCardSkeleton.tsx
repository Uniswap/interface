import { Flex, Skeleton } from 'ui/src'

// Custom skeleton loader that matches Portfolio NFTCard dimensions
export function NFTCardSkeleton(): JSX.Element {
  return (
    <Flex centered>
      <Flex m="$spacing4" maxWidth={200} width="100%">
        <Skeleton>
          <Flex p="$spacing4" borderRadius="$rounded16" borderWidth="$spacing1" borderColor="$surface3" gap="$spacing4">
            <Flex borderRadius="$rounded16" overflow="hidden">
              <Flex aspectRatio={1} backgroundColor="$neutral3" borderRadius="$rounded12" width="100%" />
            </Flex>
            <Flex py="$spacing8" px="$spacing12" gap="$spacing4">
              <Flex height={16} backgroundColor="$neutral3" borderRadius="$rounded4" width="60%" />
              <Flex height={14} backgroundColor="$neutral3" borderRadius="$rounded4" width="80%" />
            </Flex>
          </Flex>
        </Skeleton>
      </Flex>
    </Flex>
  )
}
