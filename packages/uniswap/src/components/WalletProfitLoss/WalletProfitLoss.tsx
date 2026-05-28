import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ProfitLossRow } from 'uniswap/src/components/ProfitLoss/ProfitLossRow'

interface WalletProfitLossProps {
  unrealizedReturn?: number
  unrealizedReturnPercent?: number
  realizedReturn?: number
  totalReturn?: number
  isLoading?: boolean
  disclaimer?: string
  periodSelector: JSX.Element
}

export function WalletProfitLoss({
  unrealizedReturn,
  unrealizedReturnPercent,
  realizedReturn,
  totalReturn,
  isLoading,
  disclaimer,
  periodSelector,
}: WalletProfitLossProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$gap16" width="100%" pointerEvents="box-none">
      <Flex row justifyContent="space-between" alignItems="center" width="100%" pointerEvents="box-none">
        <Text variant="subheading1" color="$neutral1" pointerEvents="none">
          {t('pnl.title')}
        </Text>
        {periodSelector}
      </Flex>
      <Flex gap="$gap12" pointerEvents="box-none">
        <ProfitLossRow
          showArrow
          labelColor="$neutral2"
          label={t('pnl.unrealizedReturn')}
          value={unrealizedReturn}
          percent={unrealizedReturnPercent}
          isLoading={isLoading}
        />
        <ProfitLossRow
          showArrow
          labelColor="$neutral2"
          label={t('pnl.realizedReturn')}
          value={realizedReturn}
          isLoading={isLoading}
        />
        <ProfitLossRow
          showArrow
          labelColor="$neutral2"
          label={t('pnl.totalReturn')}
          value={totalReturn}
          isLoading={isLoading}
        />
      </Flex>
      {disclaimer && (
        <Text variant="body4" color="$neutral3" pointerEvents="none">
          {disclaimer}
        </Text>
      )}
    </Flex>
  )
}
