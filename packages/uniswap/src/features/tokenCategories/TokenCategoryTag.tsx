import { SharedEventName } from '@uniswap/analytics-events'
import { memo } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CategoryTagPill } from 'uniswap/src/features/tokenCategories/CategoryTagPill'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'

/**
 * Row-level category tag. Pressing it opens the category's detail page on platforms that have one
 * (`navigateToCategoryDetails` in UniswapContext); elsewhere it renders as a static badge.
 */
export const TokenCategoryTag = memo(function TokenCategoryTag({ category }: { category: TokenCategory }): JSX.Element {
  // Selector form so hosts without a UniswapProvider render a static badge instead of throwing.
  const navigateToCategoryDetails = useUniswapContextSelector((ctx) => ctx.navigateToCategoryDetails)

  const onPress = useEvent((event: { preventDefault: () => void }): void => {
    // Explore table rows are anchors: without this the row link navigates too.
    event.preventDefault()
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TokenRowCategoryTag,
      category_id: category.id,
    })
    navigateToCategoryDetails?.({ categoryId: category.id })
  })

  return <CategoryTagPill label={category.name} onPress={navigateToCategoryDetails ? onPress : undefined} />
})
