import { Flex, Skeleton } from '@universe/mycelium'
import { TestID } from '@universe/test'

export function TokenDetailsClaimSkeleton(): JSX.Element {
  return (
    <Flex
      aria-busy
      gap="$spacing2"
      p="$spacing16"
      borderRadius="$rounded20"
      backgroundColor="$surface2"
      testID={TestID.TokenDetailsClaimSkeleton}
    >
      <Skeleton>
        <Flex height="$spacing28" width="60%" borderRadius="$rounded4" backgroundColor="$surface3" />
      </Skeleton>
      <Skeleton>
        <Flex height="$spacing18" width="80%" borderRadius="$rounded4" backgroundColor="$surface3" />
      </Skeleton>
    </Flex>
  )
}
