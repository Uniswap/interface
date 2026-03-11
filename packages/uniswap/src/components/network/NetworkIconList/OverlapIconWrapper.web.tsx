import { useId } from 'react'
import { Flex } from 'ui/src'
import type { OverlapIconWrapperProps } from 'uniswap/src/components/network/NetworkIconList/OverlapIconWrapper'

/**
 * Web: uses SVG <mask> + <foreignObject> so the icon is visible only in the
 * squircle region with the overlapping neighbor punched out (transparent).
 */
export function OverlapIconWrapper({
  children,
  outerSize,
  overlapPx,
  clipBorderRadius,
}: OverlapIconWrapperProps): JSX.Element {
  const baseId = useId()
  const maskId = `${baseId}-overlap-mask`

  return (
    <svg aria-hidden width={outerSize} height={outerSize} style={{ display: 'block' }}>
      <defs>
        <mask id={maskId}>
          {/* Show our full squircle */}
          <rect width={outerSize} height={outerSize} rx={clipBorderRadius} ry={clipBorderRadius} fill="white" />
          {/* Punch out the previous icon's squircle so overlap is transparent */}
          <rect
            x={overlapPx - outerSize}
            y={0}
            width={outerSize}
            height={outerSize}
            rx={clipBorderRadius}
            ry={clipBorderRadius}
            fill="black"
          />
        </mask>
      </defs>
      <foreignObject x={0} y={0} width={outerSize} height={outerSize} mask={`url(#${maskId})`}>
        <Flex centered width={outerSize} height={outerSize}>
          {children}
        </Flex>
      </foreignObject>
    </svg>
  )
}
