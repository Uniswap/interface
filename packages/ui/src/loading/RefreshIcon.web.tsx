import { forwardRef } from 'react'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { RotateRight } from 'ui/src/components/icons/RotateRight'
import { Flex } from 'ui/src/components/layout'

const rotateCSS = `
  @keyframes rotate360 {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .RotateRefreshIcon {
    animation: rotate360 1s cubic-bezier(0.83, 0, 0.17, 1) 1;
    transform-origin: center center;
  }
`

/**
 * A refresh icon component that can animate with a smooth 360-degree rotation.
 *
 * @example
 * ```tsx
 * <RefreshIcon
 *   isAnimating={isRefreshing}
 *   color="$neutral3"
 *   size="$icon.16"
 * />
 * ```
 */
export const RefreshIcon = forwardRef<HTMLDivElement, IconProps & { isAnimating?: boolean }>(function RefreshIcon(
  { isAnimating = false, ...iconProps },
  ref,
) {
  return (
    <>
      <style>{rotateCSS}</style>
      <Flex ref={ref} className={isAnimating ? 'RotateRefreshIcon' : ''}>
        <RotateRight {...iconProps} />
      </Flex>
    </>
  )
})
