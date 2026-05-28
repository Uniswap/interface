import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ProfitLossRow } from 'uniswap/src/components/ProfitLoss/ProfitLossRow'

interface TokenProfitLossProps {
  averageCost?: number
  unrealizedReturn?: number
  unrealizedReturnPercent?: number
  realizedReturn?: number
  realizedReturnPercent?: number
  totalReturn?: number
  isLoading?: boolean
  headerRight?: ReactNode
  title?: string
}

export function TokenProfitLoss({
  averageCost,
  unrealizedReturn,
  unrealizedReturnPercent,
  realizedReturn,
  realizedReturnPercent,
  totalReturn,
  isLoading,
  headerRight,
  title,
}: TokenProfitLossProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$gap16" width="100%">
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant="subheading2" color="$neutral2">
          {title ?? t('pnl.title')}
        </Text>
        {headerRight}
      </Flex>
      <Flex gap="$gap12">
        <ProfitLossRow label={t('pnl.averageCost')} value={averageCost} isLoading={isLoading} />
        <ProfitLossRow
          showArrow
          label={t('pnl.unrealizedReturn')}
          value={unrealizedReturn}
          percent={unrealizedReturnPercent}
          isLoading={isLoading}
        />
        <ProfitLossRow
          showArrow
          label={t('pnl.realizedReturn')}
          value={realizedReturn}
          percent={realizedReturnPercent}
          isLoading={isLoading}
        />
        <ProfitLossRow showArrow label={t('pnl.totalReturn')} value={totalReturn} isLoading={isLoading} />
      </Flex>
    </Flex>
  )
}
