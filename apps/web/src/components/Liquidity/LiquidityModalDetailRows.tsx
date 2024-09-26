import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { Flex, Text } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export function LiquidityModalDetailRows({
  currency0Amount,
  currency1Amount,
}: {
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
}) {
  const { formatCurrencyAmount } = useFormatter()

  return (
    <Flex py="$padding12" px="$padding16" gap="$gap8">
      <DetailLineItem
        LineItem={{
          Label: () => (
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="pool.specificPosition" values={{ symbol: currency0Amount?.currency.symbol }} />
            </Text>
          ),
          Value: () => (
            <Text variant="body3" color="$neutral1">
              {formatCurrencyAmount({ amount: currency0Amount, type: NumberType.SwapDetailsAmount })}{' '}
              {currency0Amount?.currency.symbol}
            </Text>
          ),
        }}
      />
      <DetailLineItem
        LineItem={{
          Label: () => (
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="pool.specificPosition" values={{ symbol: currency1Amount?.currency.symbol }} />
            </Text>
          ),
          Value: () => (
            <Text variant="body3" color="$neutral1">
              {formatCurrencyAmount({ amount: currency1Amount, type: NumberType.SwapDetailsAmount })}{' '}
              {currency1Amount?.currency.symbol}
            </Text>
          ),
        }}
      />
      <DetailLineItem
        LineItem={{
          Label: () => (
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="common.networkCost" />
            </Text>
          ),
          // TODO(WEB-4920): calculate estimated network cost in USD
          Value: () => (
            <Text variant="body3" color="$neutral1">
              $0
            </Text>
          ),
        }}
      />
    </Flex>
  )
}
