import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useIncreaseLiquidityContext } from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { useV2PositionDerivedInfo } from 'components/Liquidity/utils'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { useMemo } from 'react'
import { Button, Flex, Separator, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

function TokenInfo({
  currencyAmount,
  currencyUSDAmount,
}: {
  currencyAmount?: CurrencyAmount<Currency>
  currencyUSDAmount?: CurrencyAmount<Currency>
}) {
  const { formatCurrencyAmount } = useLocalizationContext()

  return (
    <Flex row alignItems="center">
      <Flex grow>
        <Text variant="heading2">
          {formatCurrencyAmount({
            value: currencyAmount,
            type: NumberType.TokenNonTx,
          })}{' '}
          {getSymbolDisplayText(currencyAmount?.currency.symbol)}
        </Text>
        <Text variant="body3" color="$neutral2">
          {formatCurrencyAmount({
            value: currencyUSDAmount,
            type: NumberType.FiatStandard,
          })}
        </Text>
      </Flex>
      <CurrencyLogo currency={currencyAmount?.currency} size={iconSizes.icon36} />
    </Flex>
  )
}

export function IncreaseLiquidityReview() {
  const { t } = useTranslation()
  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()

  const { derivedIncreaseLiquidityInfo: derivedAddLiquidityInfo, increaseLiquidityState: addLiquidityState } =
    useIncreaseLiquidityContext()
  const { currencyAmounts, currencyAmountsUSDValue } = derivedAddLiquidityInfo

  if (!addLiquidityState.position) {
    throw new Error('a position must be defined')
  }

  const { currency0Amount, currency1Amount } = addLiquidityState.position
  const { poolTokenPercentage } = useV2PositionDerivedInfo(addLiquidityState.position)

  const newToken0Amount = useMemo(() => {
    return currencyAmounts?.TOKEN0?.add(currency0Amount)
  }, [currency0Amount, currencyAmounts?.TOKEN0])
  const newToken0AmountUSD = useUSDCValue(newToken0Amount)

  const newToken1Amount = useMemo(() => {
    return currencyAmounts?.TOKEN1?.add(currency1Amount)
  }, [currency1Amount, currencyAmounts?.TOKEN1])
  const newToken1AmountUSD = useUSDCValue(newToken1Amount)

  return (
    <Flex gap="$gap16">
      <Flex gap="$gap16" px="$padding16">
        <TokenInfo currencyAmount={currencyAmounts?.TOKEN0} currencyUSDAmount={currencyAmountsUSDValue?.TOKEN0} />
        <Text variant="body3" color="$neutral2">
          {t('common.and')}
        </Text>
        <TokenInfo currencyAmount={currencyAmounts?.TOKEN1} currencyUSDAmount={currencyAmountsUSDValue?.TOKEN1} />
      </Flex>
      <Separator mx="$padding16" />
      <Flex gap="$gap8" px="$padding16">
        <DetailLineItem
          LineItem={{
            Label: () => (
              <Text variant="body3" color="$neutral2">
                {t('common.rate')}
              </Text>
            ),
            // TODO(WEB-4976): update with the actual rate. This comes from sqrtPrice and is the
            // same as Current Price in v3 current code. Get from Jack
            Value: () => <Text variant="body3">1 ETH = 1,607.58 DAI ($1,610.73)</Text>,
          }}
        />
        <>
          <DetailLineItem
            LineItem={{
              Label: () => (
                <Text variant="body3" color="$neutral2">
                  <Trans
                    i18nKey="pool.newSpecificPosition"
                    values={{ symbol: currencyAmounts?.TOKEN0?.currency.symbol }}
                  />
                </Text>
              ),
              Value: () => (
                <Flex row gap="$gap4">
                  <Text variant="body3">
                    {formatCurrencyAmount({ value: newToken0Amount, type: NumberType.TokenNonTx })}{' '}
                    {getSymbolDisplayText(newToken0Amount?.currency.symbol)}
                  </Text>
                  <Text variant="body3" color="$neutral2">
                    {`(${formatCurrencyAmount({ value: newToken0AmountUSD, type: NumberType.FiatStandard })})`}
                  </Text>
                </Flex>
              ),
            }}
          />
          <DetailLineItem
            LineItem={{
              Label: () => (
                <Text variant="body3" color="$neutral2">
                  <Trans
                    i18nKey="pool.newSpecificPosition"
                    values={{ symbol: currencyAmounts?.TOKEN1?.currency.symbol }}
                  />
                </Text>
              ),
              Value: () => (
                <Flex row gap="$gap4">
                  <Text variant="body3">
                    {formatCurrencyAmount({ value: newToken1Amount, type: NumberType.TokenNonTx })}{' '}
                    {getSymbolDisplayText(newToken1Amount?.currency.symbol)}
                  </Text>
                  <Text variant="body3" color="$neutral2">
                    {`(${formatCurrencyAmount({ value: newToken1AmountUSD, type: NumberType.FiatStandard })})`}
                  </Text>
                </Flex>
              ),
            }}
          />
        </>
        {poolTokenPercentage ? (
          <DetailLineItem
            LineItem={{
              Label: () => (
                <Text variant="body3" color="$neutral2">
                  {t('addLiquidity.shareOfPool')}
                </Text>
              ),
              Value: () => <Text>{formatPercent(poolTokenPercentage.toFixed())}</Text>,
            }}
          />
        ) : null}
        <DetailLineItem
          LineItem={{
            Label: () => (
              <Text variant="body3" color="$neutral2">
                {t('common.networkCost')}
              </Text>
            ),
            // TODO(WEB-4978): calculate this value from the trading API
            Value: () => <Text>$0</Text>,
          }}
        />
      </Flex>
      <Button>{t('common.confirm')}</Button>
    </Flex>
  )
}
