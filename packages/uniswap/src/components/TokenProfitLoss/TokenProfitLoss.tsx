import { useTranslation } from 'react-i18next'
import { type ColorTokens, Flex, Text } from 'ui/src'
import { PnlInfoTrigger } from 'uniswap/src/components/ProfitLoss/PnlInfoTrigger'
import { ProfitLossRow } from 'uniswap/src/components/ProfitLoss/ProfitLossRow'

interface TokenProfitLossProps {
  averageCost?: number
  unrealizedReturn?: number
  unrealizedReturnPercent?: number
  realizedReturn?: number
  realizedReturnPercent?: number
  totalReturn?: number
  isLoading?: boolean
  title?: string
  titleColor?: ColorTokens
}

export function TokenProfitLoss({
  averageCost,
  unrealizedReturn,
  unrealizedReturnPercent,
  realizedReturn,
  realizedReturnPercent,
  totalReturn,
  isLoading,
  title,
  titleColor = '$neutral2',
}: TokenProfitLossProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$gap16" width="100%">
      <Flex row justifyContent="space-between" alignItems="center">
        <Flex row alignItems="center" gap="$spacing4">
          <Text variant="subheading2" color={titleColor}>
            {title ?? t('pnl.title')}
          </Text>
          <PnlInfoTrigger />
        </Flex>
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
