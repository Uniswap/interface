import { SharedEventName } from '@uniswap/analytics-events'
import { spacing } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ElementName, type SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { CategoryDefinitionCard } from '~/components/CategoryDefinitionCard/CategoryDefinitionCard'
import { HoverCard, type HoverCardPlacement, useHoverCardState } from '~/components/HoverCard/HoverCard'
import { getCategoryDetailsURL } from '~/pages/Explore/CategoryDetails/getCategoryDetailsURL'

interface CategoryHoverCardProps {
  category: TokenCategory | undefined
  section: SectionName
  placement?: HoverCardPlacement
  children: ReactNode
}

/** Desktop hover card with the category definition; pressing the card opens Category Details. */
export function CategoryHoverCard({ category, children, ...props }: CategoryHoverCardProps): JSX.Element {
  if (!category) {
    return <>{children}</>
  }
  return (
    <DefinedCategoryHoverCard category={category} {...props}>
      {children}
    </DefinedCategoryHoverCard>
  )
}

function DefinedCategoryHoverCard({
  category,
  section,
  placement = 'bottom-start',
  children,
}: CategoryHoverCardProps & { category: TokenCategory }): JSX.Element {
  const navigate = useNavigate()
  const { isOpen, close, onOpenChange } = useHoverCardState()

  const onPressCard = useEvent((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.CategoryHoverCard,
      section,
      category_id: category.id,
    })
    close()
    navigate(getCategoryDetailsURL(category.id))
  })

  return (
    <HoverCard
      isOpen={isOpen}
      placement={placement}
      offset={spacing.spacing8}
      onOpenChange={onOpenChange}
      content={
        <CategoryDefinitionCard
          category={category}
          layout="popover"
          testID={TestID.CategoryDefinitionCard}
          onPress={onPressCard}
        />
      }
    >
      {children}
    </HoverCard>
  )
}
