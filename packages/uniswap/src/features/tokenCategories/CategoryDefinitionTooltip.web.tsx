import { Flex, useIsTouchDevice } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import type { CategoryDefinitionTooltipProps } from 'uniswap/src/features/tokenCategories/CategoryDefinitionTooltip'
import { CategoryDefinitionTooltipContent } from 'uniswap/src/features/tokenCategories/CategoryDefinitionTooltipContent'

const TOOLTIP_MAX_WIDTH = 243

export function CategoryDefinitionTooltip({
  category,
  onPressViewAll,
}: CategoryDefinitionTooltipProps): JSX.Element | null {
  const isTouchDevice = useIsTouchDevice()

  if (isTouchDevice) {
    return null
  }

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger>
        <Flex cursor="default">
          <InfoCircleFilled color="$neutral3" size="$icon.16" />
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content pointerEvents="auto" maxWidth={TOOLTIP_MAX_WIDTH}>
        <Tooltip.Arrow />
        <CategoryDefinitionTooltipContent category={category} onPressViewAll={onPressViewAll} />
      </Tooltip.Content>
    </Tooltip>
  )
}
