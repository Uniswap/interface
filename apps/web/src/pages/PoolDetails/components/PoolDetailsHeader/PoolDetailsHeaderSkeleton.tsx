import { Flex, Shine, styled, useMedia } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ACTION_BUBBLE_SIZE } from '~/components/Explore/stickyHeader/constants'
import { getHeaderLogoSize, getHeaderTitleLineHeight } from '~/components/Explore/stickyHeader/getHeaderLogoSize'

const HeaderActionSkeleton = styled(Flex, {
  width: ACTION_BUBBLE_SIZE.width,
  height: ACTION_BUBBLE_SIZE.height,
  borderRadius: '$roundedFull',
  backgroundColor: '$surface3',
})

interface PoolDetailsHeaderSkeletonProps {
  isCompact?: boolean
}

export function PoolDetailsHeaderSkeleton({ isCompact = false }: PoolDetailsHeaderSkeletonProps = {}) {
  const media = useMedia()
  const logoSize = getHeaderLogoSize({ isCompact, isMobile: media.md })
  const titleLineHeight = getHeaderTitleLineHeight({ isCompact, isMobile: media.md })

  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      data-testid={TestID.PoolDetailsHeaderLoadingSkeleton}
    >
      <Flex row flex={1} alignItems="center" gap="$gap12">
        <Shine>
          <Flex width={logoSize} height={logoSize} borderRadius="$roundedFull" backgroundColor="$surface3" />
        </Shine>
        <Flex gap="$gap8">
          <Shine>
            <Flex width={200} height={titleLineHeight} borderRadius="$roundedFull" backgroundColor="$surface3" />
          </Shine>
          <Shine>
            <Flex width={100} height={12} borderRadius="$roundedFull" backgroundColor="$surface3" />
          </Shine>
        </Flex>
      </Flex>
      <Flex row gap="$gap8" alignItems="center" justifyContent="center">
        <Shine>
          <HeaderActionSkeleton />
        </Shine>
        {!media.md && (
          <>
            <Shine>
              <HeaderActionSkeleton />
            </Shine>
            <Shine>
              <HeaderActionSkeleton />
            </Shine>
          </>
        )}
      </Flex>
    </Flex>
  )
}
