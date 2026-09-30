import { Flex, type FlexCompatProps, Text, zIndexes } from '@universe/mycelium'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const DisabledOverlay = (props: FlexCompatProps): JSX.Element => (
  <Flex position="absolute" width="100%" height="100%" zIndex={zIndexes.overlay} {...props} />
)

/**
 * Children stay mounted at a stable tree position so toggling `isBlocked` never remounts
 * them — a remount resets form state (e.g. amounts typed while the async permissions
 * check is still in flight). Only the overlay sibling is conditional.
 */
export function PermissionedTabWrapper({
  isBlocked,
  tokenSymbol,
  children,
}: {
  isBlocked: boolean
  tokenSymbol: string | undefined
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <Flex position="relative">
      <Flex opacity={isBlocked ? 0.6 : 1} pointerEvents={isBlocked ? 'none' : 'auto'}>
        {children}
      </Flex>
      {isBlocked && (
        <DisabledOverlay cursor="not-allowed" testID={TestID.PermissionedPoolTabOverlay}>
          <Tooltip placement="top">
            <Tooltip.Content zIndex={zIndexes.tooltip}>
              <Tooltip.Arrow />
              <Text variant="body4">
                {t('permissionedPool.surface.disabled.tooltip', { tokenSymbol: tokenSymbol ?? '' })}
              </Text>
            </Tooltip.Content>
            <Tooltip.Trigger position="relative" width="100%" height="100%">
              <DisabledOverlay />
            </Tooltip.Trigger>
          </Tooltip>
        </DisabledOverlay>
      )}
    </Flex>
  )
}
