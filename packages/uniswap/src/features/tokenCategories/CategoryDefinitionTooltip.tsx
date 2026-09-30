import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface CategoryDefinitionTooltipProps {
  category: TokenCategory
  onPressViewAll: () => void
}

/** Info icon that shows the category definition on hover; only its "View all" link navigates. */
export function CategoryDefinitionTooltip(_props: CategoryDefinitionTooltipProps): JSX.Element | null {
  throw new PlatformSplitStubError('CategoryDefinitionTooltip')
}
