import { forwardRef } from 'react'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { RotateRight } from 'ui/src/components/icons/RotateRight'
import { Flex } from 'ui/src/components/layout'

/**
 * A refresh icon component that can animate with a smooth 360-degree rotation.
 * Animation is not implemented on native.
 */
export const RefreshIcon = forwardRef<HTMLDivElement, IconProps & { isAnimating?: boolean }>(function RefreshIcon(
  { ...iconProps },
  ref,
) {
  return (
    <Flex ref={ref}>
      <RotateRight {...iconProps} />
    </Flex>
  )
})
