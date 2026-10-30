import { Flex, Text } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { SwapWarningDisplay } from '../types'
import { getWarningTextColor } from '../warnings/warningColors'

/** The row's own label cell. The adapter wraps it in the info shell and passes it back as `label`. */
export function PriceDifferenceLabel(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered row gap="$spacing4">
      <Text color="$neutral2" variant="body3">
        {t('swap.priceImpact')}
      </Text>
    </Flex>
  )
}

export interface PriceDifferenceRowProps {
  /** Pre-formatted magnitude, e.g. `3.21%`. */
  value: string
  /** Colors the icon and value by severity. */
  warning: SwapWarningDisplay
  /** Slot: the label cell, shell-wrapped by the adapter. Compose `PriceDifferenceLabel` inside it. */
  label: ReactNode
}

export function PriceDifferenceRow({ value, warning, label }: PriceDifferenceRowProps): JSX.Element {
  const color = getWarningTextColor(warning.severity)

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      {label}
      <Flex row centered shrink gap="$spacing6" justifyContent="flex-end">
        <AlertTriangleFilled color={color} size="$icon.16" />
        <Text adjustsFontSizeToFit color={color} variant="body3">
          {value}
        </Text>
      </Flex>
    </Flex>
  )
}
