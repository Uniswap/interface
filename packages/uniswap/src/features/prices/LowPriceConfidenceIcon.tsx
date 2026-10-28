import { Flex, type IconSizeTokens, Text } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const TOOLTIP_MAX_WIDTH = 218

export function LowPriceConfidenceTooltip({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Tooltip delay={{ close: 100, open: 0 }} restMs={20} placement="top">
      <Tooltip.Trigger>{children}</Tooltip.Trigger>
      <Tooltip.Content maxWidth={TOOLTIP_MAX_WIDTH}>
        <Text variant="body4" color="$neutral1">
          {t('token.price.lowConfidence.tooltip')}
        </Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}

export function LowPriceConfidenceIcon({ size = '$icon.16' }: { size?: IconSizeTokens }): JSX.Element {
  return (
    <LowPriceConfidenceTooltip>
      <Flex>
        <AlertTriangleFilled testID={TestID.LowPriceConfidenceIcon} color="$neutral3" size={size} />
      </Flex>
    </LowPriceConfidenceTooltip>
  )
}
