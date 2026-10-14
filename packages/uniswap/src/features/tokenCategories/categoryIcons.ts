import type { GeneratedIcon } from 'ui/src'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Diamond } from 'ui/src/components/icons/Diamond'
import { DollarCircle } from 'ui/src/components/icons/DollarCircle'
import { Etf } from 'ui/src/components/icons/Etf'
import { FaceLaughRelaxed } from 'ui/src/components/icons/FaceLaughRelaxed'
import { GameController } from 'ui/src/components/icons/GameController'
import { Nut } from 'ui/src/components/icons/Nut'
import { Robot } from 'ui/src/components/icons/Robot'
import { RocketLaunch } from 'ui/src/components/icons/RocketLaunch'
import { SwapCoin } from 'ui/src/components/icons/SwapCoin'
import { Tag } from 'ui/src/components/icons/Tag'
import { TrendDown } from 'ui/src/components/icons/TrendDown'
import { TrendUp } from 'ui/src/components/icons/TrendUp'
import { WavePulse } from 'ui/src/components/icons/WavePulse'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

// Keyed on backend ids — the locale-independent ListCategories contract; names are display-only
// and may arrive localized. Categories without an entry fall back to a generic tag icon.
const CATEGORY_ICONS_BY_ID: Record<string, GeneratedIcon> = {
  trending: WavePulse,
  'recently-launched': RocketLaunch,
  'top-gainers': TrendUp,
  'top-losers': TrendDown,
  majors: Diamond,
  stablecoins: DollarCircle,
  stocks: Briefcase,
  etfs: Etf,
  commodities: Nut,
  meme: FaceLaughRelaxed,
  defi: SwapCoin,
  'ai-agents': Robot,
  gaming: GameController,
}

export const FALLBACK_CATEGORY_ICON: GeneratedIcon = Tag

export function getTokenCategoryIcon(category: TokenCategory): GeneratedIcon {
  return CATEGORY_ICONS_BY_ID[category.id] ?? FALLBACK_CATEGORY_ICON
}
