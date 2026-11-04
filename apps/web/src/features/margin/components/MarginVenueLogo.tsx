import type { GeneratedIcon, IconProps } from '@universe/mycelium/icons'
import { AaveVenueTile } from '@universe/mycelium/logos/AaveVenueTile'
import { MorphoVenueTile } from '@universe/mycelium/logos/MorphoVenueTile'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'

// Venue → its app-icon tile (the brand mark in white on the brand color, corners baked in), as the market
// designs draw it. Exhaustive so adding a venue forces a decision (mirrors MARGIN_VENUE_LABELS).
const VENUE_LOGO: Record<MarginVenue, GeneratedIcon | null> = {
  MORPHO: MorphoVenueTile,
  AAVE_V3: AaveVenueTile,
  AAVE_V4: AaveVenueTile,
  // No Compound tile in mycelium yet — the row renders label-only until Product supplies one.
  COMPOUND_V3: null,
}

export function MarginVenueLogo({
  venue,
  size = '$icon.16',
}: {
  venue: MarginVenue
  size?: IconProps['size']
}): JSX.Element | null {
  const Logo = VENUE_LOGO[venue]
  return Logo ? <Logo size={size} /> : null
}
