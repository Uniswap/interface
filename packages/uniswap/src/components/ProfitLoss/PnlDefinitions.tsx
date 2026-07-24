import { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'

export type PnlMetric = 'averageCost' | 'unrealizedReturn' | 'realizedReturn' | 'totalReturn'

export const ALL_PNL_METRICS: PnlMetric[] = ['averageCost', 'unrealizedReturn', 'realizedReturn', 'totalReturn']

export interface PnlDefinition {
  label: string
  description: string
}

export function usePnlDefinitions(metrics: PnlMetric[] = ALL_PNL_METRICS): PnlDefinition[] {
  const { t } = useTranslation()

  const definitions: Record<PnlMetric, PnlDefinition> = {
    averageCost: { label: t('pnl.averageCost'), description: t('pnl.averageCost.description') },
    unrealizedReturn: { label: t('pnl.unrealizedReturn'), description: t('pnl.unrealizedReturn.description') },
    realizedReturn: { label: t('pnl.realizedReturn'), description: t('pnl.realizedReturn.description') },
    totalReturn: { label: t('pnl.totalReturn'), description: t('pnl.totalReturn.description') },
  }

  return metrics.map((metric) => definitions[metric])
}

export function PnlDefinitionsList({
  metrics,
  gap = '$spacing16',
  footer,
}: {
  metrics?: PnlMetric[]
  gap?: ComponentProps<typeof Flex>['gap']
  footer?: string
}): JSX.Element {
  const definitions = usePnlDefinitions(metrics)

  return (
    <Flex gap={gap} width="100%">
      {definitions.map(({ label, description }) => (
        <Flex key={label} gap="$spacing2">
          <Text color="$neutral1" variant="body3">
            {label}
          </Text>
          <Text color="$neutral2" variant="body3">
            {description}
          </Text>
        </Flex>
      ))}
      {footer && (
        <Text color="$neutral2" variant="body3">
          {footer}
        </Text>
      )}
    </Flex>
  )
}
