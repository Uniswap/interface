import { Flex, spacing } from '@universe/mycelium'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { TokenCategoryPileLogo } from 'uniswap/src/features/tokenCategories/types'

const MAX_VISIBLE_LOGOS = 3
/** Each subsequent logo tucks a third of its width under its predecessor. */
const OVERLAP_RATIO = 1 / 3
/** `$surface1` ring separating overlapping logos. Rendered as wrapper padding, then pulled back out of layout. */
const RING_WIDTH = spacing.spacing2

/** Up to three overlapping logos, first on top, for category rows and cards; feed it `getCategoryPileLogos`. */
export function TokenLogoPile({ logos, size }: { logos: TokenCategoryPileLogo[]; size: number }): JSX.Element {
  const visibleLogos = logos.slice(0, MAX_VISIBLE_LOGOS)

  return (
    <Flex row m={-RING_WIDTH}>
      {visibleLogos.map((logo, index) => (
        <Flex
          key={logo.key}
          backgroundColor="$surface1"
          borderRadius="$roundedFull"
          // The extra 2×ring keeps the logo-to-logo overlap at OVERLAP_RATIO despite the padding.
          ml={index > 0 ? -(Math.round(size * OVERLAP_RATIO) + 2 * RING_WIDTH) : 0}
          overflow="hidden"
          p={RING_WIDTH}
          zIndex={visibleLogos.length - index}
        >
          {/* Network badge omitted: at pile sizes it covers most of the logo. */}
          <TokenLogo hideNetworkLogo name={logo.name} size={size} symbol={logo.symbol} url={logo.logoUrl} />
        </Flex>
      ))}
    </Flex>
  )
}
