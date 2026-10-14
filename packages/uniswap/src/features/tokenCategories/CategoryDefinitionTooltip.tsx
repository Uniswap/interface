import type { SectionName } from 'uniswap/src/features/telemetry/constants'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface CategoryDefinitionTooltipProps {
  category: TokenCategory
  /** Surface for the opened event; falls back to the enclosing Trace section (e.g. Navbar Search). */
  section?: SectionName
  onPressViewAll: () => void
}

/** Info icon that shows the category definition on hover; only its "View all" link navigates. */
export function CategoryDefinitionTooltip(_props: CategoryDefinitionTooltipProps): JSX.Element | null {
  throw new PlatformSplitStubError('CategoryDefinitionTooltip')
}
