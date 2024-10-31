import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Trans } from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'

export function LiquidityModalDetailRows({
  currency0Amount,
  currency1Amount,
  networkCost,
}: {
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  networkCost?: CurrencyAmount<Currency>
}) {
  const { formatCurrencyAmount } = useLocalizationContext()

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
              {formatCurrencyAmount({ value: currency0Amount, type: NumberType.TokenNonTx })}{' '}
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
              {formatCurrencyAmount({ value: currency1Amount, type: NumberType.TokenNonTx })}{' '}
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
          Value: () => (
            <Text variant="body3" color="$neutral1">
              {formatCurrencyAmount({ value: networkCost, type: NumberType.FiatGasPrice })}
            </Text>
          ),
        }}
      />
    </Flex>
  )
}
