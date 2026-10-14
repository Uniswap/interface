import { Flex, useIsTouchDevice } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { CategoryDefinitionTooltipProps } from 'uniswap/src/features/tokenCategories/CategoryDefinitionTooltip'
import { CategoryDefinitionTooltipContent } from 'uniswap/src/features/tokenCategories/CategoryDefinitionTooltipContent'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const TOOLTIP_MAX_WIDTH = 243

export function CategoryDefinitionTooltip({
  category,
  section,
  onPressViewAll,
}: CategoryDefinitionTooltipProps): JSX.Element | null {
  const isTouchDevice = useIsTouchDevice()
  const trace = useTrace()

  const onOpenChange = useEvent((open: boolean): void => {
    if (!open) {
      return
    }
    sendAnalyticsEvent(InterfaceEventName.CategoryDefinitionCardOpened, {
      ...trace,
      ...(section ? { section } : {}),
      category_id: category.id,
      trigger: 'hover',
    })
  })

  if (isTouchDevice) {
    return null
  }

  return (
    <Tooltip placement="top" onOpenChange={onOpenChange}>
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
