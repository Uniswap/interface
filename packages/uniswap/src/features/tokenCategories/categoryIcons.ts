import type { GeneratedIcon } from '@universe/mycelium/icons'
import { Briefcase } from '@universe/mycelium/icons/Briefcase'
import { Correlated } from '@universe/mycelium/icons/Correlated'
import { Diamond } from '@universe/mycelium/icons/Diamond'
import { DollarCircle } from '@universe/mycelium/icons/DollarCircle'
import { Etf } from '@universe/mycelium/icons/Etf'
import { FaceLaughRelaxed } from '@universe/mycelium/icons/FaceLaughRelaxed'
import { GameController } from '@universe/mycelium/icons/GameController'
import { Nut } from '@universe/mycelium/icons/Nut'
import { Robot } from '@universe/mycelium/icons/Robot'
import { RocketLaunch } from '@universe/mycelium/icons/RocketLaunch'
import { Stable } from '@universe/mycelium/icons/Stable'
import { Staking } from '@universe/mycelium/icons/Staking'
import { SwapCoin } from '@universe/mycelium/icons/SwapCoin'
import { Tag } from '@universe/mycelium/icons/Tag'
import { TrendDown } from '@universe/mycelium/icons/TrendDown'
import { TrendUp } from '@universe/mycelium/icons/TrendUp'
import { WavePulse } from '@universe/mycelium/icons/WavePulse'
import type { CategoryBase } from 'uniswap/src/features/tokenCategories/types'

// Keyed on backend ids — the locale-independent ListCategories contract; names are display-only
// and may arrive localized. Ids are unique across kinds. Categories without an entry fall back to a
// generic tag icon.
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
  // Pool categories reuse their token twin's icon unless design drew a pool-specific one.
  'major-pools': Diamond,
  'stable-pools': Stable,
  correlated: Correlated,
  // Design calls this category Staking; the seed id is accruing.
  accruing: Staking,
  'stock-pools': Briefcase,
  'etf-pools': Etf,
  'commodity-pools': Nut,
  'trending-pools': WavePulse,
  'new-pools': RocketLaunch,
  'defi-pools': SwapCoin,
  'ai-pools': Robot,
  'meme-pools': FaceLaughRelaxed,
}

export const FALLBACK_CATEGORY_ICON: GeneratedIcon = Tag

export function getCategoryIcon(category: CategoryBase): GeneratedIcon {
  return CATEGORY_ICONS_BY_ID[category.id] ?? FALLBACK_CATEGORY_ICON
}
