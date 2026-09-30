import { Flex, type FlexCompatProps } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'
import { Shine } from 'ui/src'
import { ACTION_BUBBLE_SIZE } from '~/components/StickyCollapsibleHeader/constants'
import {
  getDetailHeaderLogoSize,
  getHeaderTitleLineHeight,
  getPoolHeaderColumnGapProps,
  getPoolHeaderLogoWidth,
} from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
const HeaderActionSkeleton: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function HeaderActionSkeleton(props, ref) {
  return (
    <Flex
      ref={ref}
      width={ACTION_BUBBLE_SIZE.width}
      height={ACTION_BUBBLE_SIZE.height}
      borderRadius="$roundedFull"
      backgroundColor="$surface3"
      {...props}
    />
  )
})

interface PoolDetailsHeaderSkeletonProps {
  isCompact?: boolean
}

export function PoolDetailsHeaderSkeleton({ isCompact = false }: PoolDetailsHeaderSkeletonProps = {}) {
  const media = useMedia()
  const logoSize = getDetailHeaderLogoSize({ isCompact, media })
  const titleLineHeight = getHeaderTitleLineHeight({ isCompact, media })
  // Shared with AnimatedDoubleLogo so the reserved width cannot drift from the loaded one.
  const logoWidth = getPoolHeaderLogoWidth({ isCompact, media })

  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      gap="$gap8"
      data-testid={TestID.PoolDetailsHeaderLoadingSkeleton}
    >
      <Flex row flex={1} alignItems="center" gap="$gap12">
        <Shine>
          <Flex
            data-testid={TestID.PoolDetailsHeaderSkeletonLogo}
            width={logoWidth}
            height={logoSize}
            borderRadius="$roundedFull"
            backgroundColor="$surface3"
          />
        </Shine>
        <Flex data-testid={TestID.PoolDetailsHeaderSkeletonTitleColumn} {...getPoolHeaderColumnGapProps(isCompact)}>
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
