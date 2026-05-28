import { useSporeColors } from 'ui/src/hooks/useSporeColors'

interface FdvArrowMarkerProps {
  width?: number
  height?: number
}

/**
 * Arrow marker icon for the FDV progress indicator.
 * Uses theme-aware colors for both fill and stroke.
 */
export function FdvArrowMarker({ width = 13, height = 14 }: FdvArrowMarkerProps): JSX.Element {
  const colors = useSporeColors()
  const fillColor = colors.neutral1.val
  const strokeColor = colors.surface1.val

  return (
    <svg width={width} height={height} viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.9458 11.0615C4.80051 13.1128 7.70633 13.1128 8.56103 11.0615L11.311 4.46191C11.9972 2.8152 10.7874 1 9.00342 1H3.50342C1.71947 1 0.509668 2.81519 1.1958 4.46191L3.9458 11.0615Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
      />
    </svg>
  )
}
