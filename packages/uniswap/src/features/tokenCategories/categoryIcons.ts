import type { GeneratedIcon } from 'ui/src'
import { AlertCircleFilled } from 'ui/src/components/icons/AlertCircleFilled'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Coin } from 'ui/src/components/icons/Coin'
import { Etf } from 'ui/src/components/icons/Etf'
import { Nut } from 'ui/src/components/icons/Nut'
import { Rocket } from 'ui/src/components/icons/Rocket'
import { Tag } from 'ui/src/components/icons/Tag'
import { TrendDown } from 'ui/src/components/icons/TrendDown'
import { TrendUp } from 'ui/src/components/icons/TrendUp'
import { WavePulse } from 'ui/src/components/icons/WavePulse'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

// Keyed on backend ids — the locale-independent ListCategories contract; names are display-only
// and may arrive localized. Categories without an entry fall back to a generic tag icon.
const CATEGORY_ICONS_BY_ID: Record<string, GeneratedIcon> = {
  trending: WavePulse,
  'recently-launched': Rocket,
  'top-gainers': TrendUp,
  'top-losers': TrendDown,
  'high-volatility': AlertCircleFilled,
  stablecoins: Coin,
  stocks: Briefcase,
  etfs: Etf,
  commodities: Nut,
}

export const FALLBACK_CATEGORY_ICON: GeneratedIcon = Tag

export function getTokenCategoryIcon(category: TokenCategory): GeneratedIcon {
  return CATEGORY_ICONS_BY_ID[category.id] ?? FALLBACK_CATEGORY_ICON
}
