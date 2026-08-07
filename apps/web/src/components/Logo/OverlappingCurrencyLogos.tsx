import { Flex, Text } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

const DEFAULT_MAX_SHOWN = 3
// Transparent gap punched between adjacent logos, rather than an opaque ring in a background colour,
// so the cluster reads the same on whatever surface it sits on.
const MASK_GAP = 2
// Feathers the cut by 1px. A hard colour stop renders visibly jagged on a curve.
const MASK_FEATHER = 0.5

/**
 * Cuts a circular notch out of a logo where its predecessor overlaps it.
 *
 * Logos overlap by half their width and earlier ones paint on top, so each logo's local (0, 50%) is
 * exactly the previous logo's centre. Cutting a radius of `size / 2 + MASK_GAP` there removes the
 * predecessor's disc plus a MASK_GAP-wide ring around it — and since the predecessor only covers
 * `size / 2`, that ring is left transparent and the background shows through.
 */
function overlapMask(size: number): string {
  const radius = size / 2 + MASK_GAP
  return `radial-gradient(circle at 0 50%, transparent ${radius - MASK_FEATHER}px, #000 ${radius + MASK_FEATHER}px)`
}

/**
 * Horizontal cluster of overlapping token logos, capped at `max`.
 *
 * Callers pass only currencies that resolved — an unresolved one would contribute an empty box and a
 * notch cut for nothing, leaving a hole in the cluster. Pass `totalCount` to close the cluster with a
 * "+N" chip covering both the capped and the unresolved remainder; omit it to cap silently.
 */
export function OverlappingCurrencyLogos({
  currencyInfos,
  size,
  max = DEFAULT_MAX_SHOWN,
  totalCount,
}: {
  currencyInfos: CurrencyInfo[]
  size: number
  max?: number
  totalCount?: number
}): JSX.Element {
  const shown = currencyInfos.slice(0, max)
  const overflow = totalCount === undefined ? 0 : totalCount - shown.length
  const mask = overlapMask(size)
  // Earlier entries paint on top, and the "+N" chip is just the last entry in that order.
  const total = shown.length + (overflow > 0 ? 1 : 0)

  return (
    <Flex row alignItems="center">
      {shown.map((currencyInfo, index) => (
        <Flex
          key={currencyInfo.currencyId}
          ml={index === 0 ? 0 : -size / 2}
          zIndex={total - index}
          borderRadius="$roundedFull"
          style={index === 0 ? undefined : { maskImage: mask, WebkitMaskImage: mask }}
        >
          <CurrencyLogo currencyInfo={currencyInfo} size={size} hideNetworkLogo />
        </Flex>
      ))}
      {overflow > 0 && (
        <Flex
          ml={shown.length === 0 ? 0 : -size / 2}
          zIndex={total - shown.length}
          borderRadius="$roundedFull"
          style={shown.length === 0 ? undefined : { maskImage: mask, WebkitMaskImage: mask }}
          width={size}
          height={size}
          centered
          backgroundColor="$surface3"
        >
          <Text variant="body4" color="$neutral2">
            +{overflow}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
