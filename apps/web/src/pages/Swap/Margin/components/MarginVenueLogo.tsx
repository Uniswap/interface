import type { GeneratedIcon, IconProps } from 'ui/src'
import { AaveLogo } from 'ui/src/components/icons/AaveLogo'
import { MorphoLogo } from 'ui/src/components/icons/MorphoLogo'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'

// Venue → brand ghost. Exhaustive so adding a venue forces a decision (mirrors MARGIN_VENUE_LABELS).
const VENUE_LOGO: Record<MarginVenue, GeneratedIcon | null> = {
  MORPHO: MorphoLogo,
  AAVE_V3: AaveLogo,
  AAVE_V4: AaveLogo,
  // No Compound brand icon in ui/src yet — the row renders label-only until Product supplies one.
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
