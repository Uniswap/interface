import { Flex, Text } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { DetailRow } from '@universe/transactions-ui/src/common/DetailRow/DetailRow'
import { getWarningLevelTextColor, type WarningLevel } from '@universe/transactions-ui/src/common/warningLevel'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

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

function PriceDifferenceValue({ value, level }: { value: string; level?: WarningLevel }): JSX.Element {
  const color = getWarningLevelTextColor(level ?? 'info')

  // Fragment: DetailRow's value container already lays out the icon and value (row, end-aligned, gap 6).
  return (
    <>
      <AlertTriangleFilled color={color} size="$icon.16" />
      <Text adjustsFontSizeToFit color={color} variant="body3">
        {value}
      </Text>
    </>
  )
}

export interface PriceDifferenceRowProps {
  /** Pre-formatted magnitude, e.g. `3.21%`. */
  value: string
  /** Colors the icon and value. No level renders the info color. */
  level?: WarningLevel
  /** Slot: the label cell, shell-wrapped by the adapter. Compose `PriceDifferenceLabel` inside it. */
  label: ReactNode
}

export function PriceDifferenceRow({ value, level, label }: PriceDifferenceRowProps): JSX.Element {
  return <DetailRow label={label} value={<PriceDifferenceValue level={level} value={value} />} />
}
