import { Flex, Text, Tooltip } from 'ui/src'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useTokenWarningCardText } from 'uniswap/src/features/tokens/warnings/safetyUtils'

const TOOLTIP_MAX_WIDTH = 280

/**
 * Warning icon badge for search result rows. On web/extension, hovering opens a tooltip with the
 * warning title and description (same copy as the TDP warning card). On native, `Tooltip` renders
 * only the icon (trigger children pass through; content is a no-op).
 */
export function TokenOptionWarningBadge({
  currencyInfo,
  severity,
}: {
  currencyInfo: CurrencyInfo
  severity: WarningSeverity
}): JSX.Element {
  const { heading, description } = useTokenWarningCardText(currencyInfo)

  const icon = (
    <Flex>
      <WarningIcon severity={severity} size="$icon.16" />
    </Flex>
  )

  if (!heading && !description) {
    return icon
  }

  return (
    <Tooltip delay={{ close: 100, open: 0 }} restMs={20} placement="top">
      <Tooltip.Trigger>{icon}</Tooltip.Trigger>
      <Tooltip.Content maxWidth={TOOLTIP_MAX_WIDTH}>
        <Flex gap="$spacing4">
          {heading && (
            <Text variant="body4" color="$neutral1">
              {heading}
            </Text>
          )}
          {description && (
            <Text variant="body4" color="$neutral2">
              {description}
            </Text>
          )}
        </Flex>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
