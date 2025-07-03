import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { useCurrencyInfo } from 'hooks/Tokens'
import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function LiquidityModalDetailRows({
  currency0Amount,
  currency1Amount,
  networkCost,
}: {
  currency0Amount?: CurrencyAmount<Currency>
  currency1Amount?: CurrencyAmount<Currency>
  networkCost?: CurrencyAmount<Currency>
}) {
  const { formatCurrencyAmount, convertFiatAmountFormatted } = useLocalizationContext()
  const currency0Info = useCurrencyInfo(currency0Amount?.currency)
  const currency1Info = useCurrencyInfo(currency1Amount?.currency)

  return (
    <Flex px="$padding16" gap="$gap8">
      <DetailLineItem
        LineItem={{
          Label: () => (
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="pool.specificPosition" values={{ symbol: currency0Amount?.currency.symbol }} />
            </Text>
          ),
          Value: () => (
            <Flex row gap="$gap4" alignItems="center">
              <CurrencyLogo currencyInfo={currency0Info} size={iconSizes.icon16} />
              <Text variant="body3" color="$neutral1">
                {formatCurrencyAmount({ value: currency0Amount, type: NumberType.TokenNonTx })}{' '}
                {currency0Amount?.currency.symbol}
              </Text>
            </Flex>
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
            <Flex row gap="$gap4" alignItems="center">
              <CurrencyLogo currencyInfo={currency1Info} size={iconSizes.icon16} />
              <Text variant="body3" color="$neutral1">
                {formatCurrencyAmount({ value: currency1Amount, type: NumberType.TokenNonTx })}{' '}
                {currency1Amount?.currency.symbol}
              </Text>
            </Flex>
          ),
        }}
      />
      {Boolean(networkCost) && !!currency0Amount && (
        <DetailLineItem
          LineItem={{
            Label: () => (
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="common.networkCost" />
              </Text>
            ),
            Value: () => (
              <Flex row gap="$gap4" alignItems="center">
                <NetworkLogo chainId={currency0Amount.currency.chainId} size={iconSizes.icon16} shape="square" />
                <Text variant="body3" color="$neutral1">
                  {convertFiatAmountFormatted(networkCost?.toExact(), NumberType.FiatGasPrice)}
                </Text>
              </Flex>
            ),
          }}
        />
      )}
    </Flex>
  )
}
