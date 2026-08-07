import type { ReactNode } from 'react'
import { Flex, Text, Tooltip } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { zIndexes } from 'ui/src/theme'

export function PermissionedTokenTooltip({
  baseText,
  verifiedSuffix,
  trigger,
  offset,
}: {
  baseText: string
  verifiedSuffix?: string
  trigger?: ReactNode
  // Per Figma, the TDP pill variant overlaps its trigger; swap-pill lock icon keeps the design-system default gap.
  offset?: { mainAxis?: number }
}): JSX.Element {
  return (
    <Tooltip placement="top" delay={{ close: 0, open: 150 }} restMs={0} offset={offset}>
      <Tooltip.Trigger asChild>
        {trigger ?? (
          <Flex alignSelf="flex-start">
            <InfoCircleFilled size="$icon.20" color="$neutral3" />
          </Flex>
        )}
      </Tooltip.Trigger>
      <Tooltip.Content zIndex={zIndexes.tooltip} px="$padding12" py="$padding8">
        <Tooltip.Arrow />
        <Text variant="body4" color="$neutral1" maxWidth={260}>
          {baseText}
          {verifiedSuffix ? (
            <>
              {' '}
              <Text variant="body4" color="$neutral2">
                {verifiedSuffix}
              </Text>
            </>
          ) : null}
        </Text>
      </Tooltip.Content>
    </Tooltip>
  )
}
